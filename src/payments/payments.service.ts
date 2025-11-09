import {
  Injectable,
  BadRequestException,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Between } from 'typeorm';
import { InjectQueue } from '@nestjs/bull';
import { Queue } from 'bull';
import { v4 as uuidv4 } from 'uuid';
import { Payment } from './entities/payment.entity';
import { Transaction } from './entities/transaction.entity';
import { ApiConsumer } from '@/auth/entities/api-consumer.entity';
import { CreatePaymentDto } from './dto/create-payment.dto';
import { RefundPaymentDto } from './dto/refund-payment.dto';
import { PaymentStatus, TransactionType } from '@/common/enums/payment.enum';
import { MnoService } from '@/mno/mno.service';
import { BillingService } from '@/billing/billing.service';
import { AuditService } from '@/audit/audit.service';

@Injectable()
export class PaymentsService {
  constructor(
    @InjectRepository(Payment)
    private readonly paymentRepository: Repository<Payment>,
    @InjectRepository(Transaction)
    private readonly transactionRepository: Repository<Transaction>,
    @InjectQueue('payments')
    private readonly paymentsQueue: Queue,
    private readonly mnoService: MnoService,
    private readonly billingService: BillingService,
    private readonly auditService: AuditService,
  ) {}

  async createPayment(
    createPaymentDto: CreatePaymentDto,
    consumer: ApiConsumer,
    idempotencyKey?: string,
  ): Promise<Payment> {
    // Check for existing payment with same idempotency key
    if (idempotencyKey) {
      const existingPayment = await this.paymentRepository.findOne({
        where: { idempotencyKey, consumerId: consumer.id },
      });
      
      if (existingPayment) {
        return existingPayment;
      }
    }

    // Create payment
    const payment = this.paymentRepository.create({
      ...createPaymentDto,
      consumerId: consumer.id,
      idempotencyKey,
      expiresAt: new Date(Date.now() + 30 * 60 * 1000), // 30 minutes
    });

    const savedPayment = await this.paymentRepository.save(payment);

    // Log usage for billing
    await this.billingService.logApiUsage(consumer.id, 1, createPaymentDto.amount);

    // Audit log
    await this.auditService.log({
      action: 'payment.created',
      resourceId: savedPayment.id,
      resourceType: 'payment',
      userId: consumer.id,
      metadata: { amount: createPaymentDto.amount, mno: createPaymentDto.mno },
    });

    // Queue payment initiation
    await this.paymentsQueue.add('initiate-payment', { paymentId: savedPayment.id });

    return savedPayment;
  }

  async initiatePayment(paymentId: string): Promise<void> {
    const payment = await this.paymentRepository.findOne({
      where: { id: paymentId },
    });

    if (!payment) {
      throw new NotFoundException('Payment not found');
    }

    if (payment.status !== PaymentStatus.CREATED) {
      return; // Already processed
    }

    try {
      // Update status to initiated
      payment.status = PaymentStatus.INITIATED;
      await this.paymentRepository.save(payment);

      // Call MNO API
      const result = await this.mnoService.initiatePayment({
        amount: payment.amount,
        phoneNumber: payment.phoneNumber,
        mno: payment.mno,
        reference: payment.id,
      });

      // Update with MNO reference
      payment.mnoReference = result.reference;
      payment.status = PaymentStatus.PENDING;
      await this.paymentRepository.save(payment);

      // Create transaction record
      await this.transactionRepository.save({
        paymentId: payment.id,
        type: TransactionType.PAYMENT,
        amount: payment.amount,
        currency: payment.currency,
        status: 'pending',
        mnoTransactionId: result.reference,
        rawPayload: result,
      });

      await this.auditService.log({
        action: 'payment.initiated',
        resourceId: payment.id,
        resourceType: 'payment',
        metadata: { mnoReference: result.reference },
      });

    } catch (error) {
      payment.status = PaymentStatus.FAILED;
      await this.paymentRepository.save(payment);

      await this.auditService.log({
        action: 'payment.failed',
        resourceId: payment.id,
        resourceType: 'payment',
        metadata: { error: error.message },
      });

      throw error;
    }
  }

  async getPayment(id: string, consumerId?: string): Promise<Payment> {
    const where: any = { id };
    if (consumerId) {
      where.consumerId = consumerId;
    }

    const payment = await this.paymentRepository.findOne({
      where,
      relations: ['transactions', 'consumer'],
    });

    if (!payment) {
      throw new NotFoundException('Payment not found');
    }

    return payment;
  }

  async listPayments(
    consumerId: string,
    filters: {
      status?: PaymentStatus;
      dateFrom?: Date;
      dateTo?: Date;
      limit?: number;
      offset?: number;
    } = {},
  ): Promise<{ payments: Payment[]; total: number }> {
    const { status, dateFrom, dateTo, limit = 50, offset = 0 } = filters;

    const where: any = { consumerId };
    
    if (status) {
      where.status = status;
    }

    if (dateFrom && dateTo) {
      where.createdAt = Between(dateFrom, dateTo);
    }

    const [payments, total] = await this.paymentRepository.findAndCount({
      where,
      relations: ['transactions'],
      order: { createdAt: 'DESC' },
      take: limit,
      skip: offset,
    });

    return { payments, total };
  }

  async refundPayment(
    paymentId: string,
    refundDto: RefundPaymentDto,
    consumerId: string,
    idempotencyKey?: string,
  ): Promise<Transaction> {
    const payment = await this.getPayment(paymentId, consumerId);

    if (payment.status !== PaymentStatus.COMPLETED && payment.status !== PaymentStatus.SETTLED) {
      throw new BadRequestException('Payment cannot be refunded');
    }

    const refundAmount = refundDto.amount || payment.amount;

    if (refundAmount > payment.amount) {
      throw new BadRequestException('Refund amount cannot exceed payment amount');
    }

    // Check for existing refund with same idempotency key
    if (idempotencyKey) {
      const existingRefund = await this.transactionRepository.findOne({
        where: {
          paymentId: payment.id,
          type: TransactionType.REFUND,
          rawPayload: { idempotencyKey },
        },
      });

      if (existingRefund) {
        return existingRefund;
      }
    }

    // Create refund transaction
    const refundTransaction = this.transactionRepository.create({
      paymentId: payment.id,
      type: TransactionType.REFUND,
      amount: refundAmount,
      currency: payment.currency,
      status: 'pending',
      rawPayload: { reason: refundDto.reason, idempotencyKey },
    });

    const savedRefund = await this.transactionRepository.save(refundTransaction);

    // Queue refund processing
    await this.paymentsQueue.add('process-refund', { 
      refundId: savedRefund.id,
      paymentId: payment.id,
    });

    await this.auditService.log({
      action: 'payment.refund_requested',
      resourceId: payment.id,
      resourceType: 'payment',
      userId: consumerId,
      metadata: { amount: refundAmount, reason: refundDto.reason },
    });

    return savedRefund;
  }

  async updatePaymentStatus(
    paymentId: string,
    status: PaymentStatus,
    mnoTransactionId?: string,
    metadata?: any,
  ): Promise<void> {
    const payment = await this.paymentRepository.findOne({
      where: { id: paymentId },
    });

    if (!payment) {
      throw new NotFoundException('Payment not found');
    }

    const oldStatus = payment.status;
    payment.status = status;
    
    if (mnoTransactionId) {
      payment.mnoReference = mnoTransactionId;
    }

    await this.paymentRepository.save(payment);

    // Create status update transaction
    await this.transactionRepository.save({
      paymentId: payment.id,
      type: TransactionType.PAYMENT,
      amount: 0,
      currency: payment.currency,
      status: status.toLowerCase(),
      mnoTransactionId,
      rawPayload: metadata,
      processedAt: new Date(),
    });

    await this.auditService.log({
      action: 'payment.status_updated',
      resourceId: payment.id,
      resourceType: 'payment',
      metadata: { oldStatus, newStatus: status, mnoTransactionId },
    });

    // Trigger callback if configured
    if (payment.callbackUrl && (status === PaymentStatus.COMPLETED || status === PaymentStatus.FAILED)) {
      await this.paymentsQueue.add('send-callback', {
        paymentId: payment.id,
        callbackUrl: payment.callbackUrl,
        status,
      });
    }
  }
}