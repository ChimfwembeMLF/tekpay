import { Processor, Process } from '@nestjs/bull';
import { Logger } from '@nestjs/common';
import { Job } from 'bull';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Between } from 'typeorm';
import { Payment } from '@/payments/entities/payment.entity';
import { Transaction } from '@/payments/entities/transaction.entity';
import { MnoService } from '@/mno/mno.service';
import { AuditService } from '@/audit/audit.service';
import { PaymentStatus } from '@/common/enums/payment.enum';

@Processor('reconciliation')
export class ReconciliationProcessor {
  private readonly logger = new Logger(ReconciliationProcessor.name);

  constructor(
    @InjectRepository(Payment)
    private readonly paymentRepository: Repository<Payment>,
    @InjectRepository(Transaction)
    private readonly transactionRepository: Repository<Transaction>,
    private readonly mnoService: MnoService,
    private readonly auditService: AuditService,
  ) {}

  @Process('daily-reconciliation')
  async handleDailyReconciliation(job: Job) {
    const { date } = job.data;
    const reconciliationDate = date ? new Date(date) : new Date();
    
    this.logger.log(`Starting daily reconciliation for: ${reconciliationDate.toDateString()}`);
    
    try {
      const startOfDay = new Date(reconciliationDate);
      startOfDay.setHours(0, 0, 0, 0);
      
      const endOfDay = new Date(reconciliationDate);
      endOfDay.setHours(23, 59, 59, 999);

      // Get all completed payments for the day
      const payments = await this.paymentRepository.find({
        where: {
          status: PaymentStatus.COMPLETED,
          updatedAt: Between(startOfDay, endOfDay),
        },
        relations: ['transactions'],
      });

      let reconciledCount = 0;
      let discrepancyCount = 0;

      for (const payment of payments) {
        try {
          // Check payment status with MNO
          const mnoStatus = await this.mnoService.checkPaymentStatus(
            payment.mnoReference,
            payment.mno,
          );

          if (mnoStatus.status === 'completed' && payment.status === PaymentStatus.COMPLETED) {
            // Mark as settled if not already
            if (payment.status === PaymentStatus.COMPLETED) {
              payment.status = PaymentStatus.SETTLED;
              await this.paymentRepository.save(payment);
            }
            reconciledCount++;
          } else {
            // Discrepancy found
            discrepancyCount++;
            
            await this.auditService.log({
              action: 'reconciliation.discrepancy',
              resourceType: 'payment',
              resourceId: payment.id,
              metadata: {
                internalStatus: payment.status,
                mnoStatus: mnoStatus.status,
                amount: payment.amount,
              },
            });
          }
        } catch (error) {
          this.logger.error(`Reconciliation failed for payment ${payment.id}:`, error);
          discrepancyCount++;
        }
      }

      const summary = {
        date: reconciliationDate.toDateString(),
        totalPayments: payments.length,
        reconciled: reconciledCount,
        discrepancies: discrepancyCount,
        timestamp: new Date().toISOString(),
      };

      await this.auditService.log({
        action: 'reconciliation.completed',
        resourceType: 'reconciliation',
        metadata: summary,
      });

      this.logger.log(`Daily reconciliation completed:`, summary);
      
      return summary;
    } catch (error) {
      this.logger.error(`Daily reconciliation failed:`, error);
      
      await this.auditService.log({
        action: 'reconciliation.failed',
        resourceType: 'reconciliation',
        metadata: { error: error.message, date: reconciliationDate.toDateString() },
      });
      
      throw error;
    }
  }

  @Process('payment-status-check')
  async handlePaymentStatusCheck(job: Job) {
    const { paymentId } = job.data;
    
    try {
      const payment = await this.paymentRepository.findOne({
        where: { id: paymentId },
      });

      if (!payment || !payment.mnoReference) {
        return;
      }

      const status = await this.mnoService.checkPaymentStatus(
        payment.mnoReference,
        payment.mno,
      );

      this.logger.log(`Status check for payment ${paymentId}: ${status.status}`);
      
      // Update payment status if different
      const newStatus = this.mapStatusToInternal(status.status);
      
      if (newStatus && newStatus !== payment.status) {
        payment.status = newStatus;
        await this.paymentRepository.save(payment);
        
        await this.auditService.log({
          action: 'payment.status_updated_by_check',
          resourceType: 'payment',
          resourceId: payment.id,
          metadata: { oldStatus: payment.status, newStatus, mnoStatus: status },
        });
      }
      
    } catch (error) {
      this.logger.error(`Payment status check failed for ${paymentId}:`, error);
      throw error;
    }
  }

  private mapStatusToInternal(mnoStatus: string): PaymentStatus | null {
    const statusMap: Record<string, PaymentStatus> = {
      'completed': PaymentStatus.COMPLETED,
      'failed': PaymentStatus.FAILED,
      'pending': PaymentStatus.PENDING,
      'cancelled': PaymentStatus.FAILED,
      'expired': PaymentStatus.EXPIRED,
    };

    return statusMap[mnoStatus.toLowerCase()] || null;
  }
}