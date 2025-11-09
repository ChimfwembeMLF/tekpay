import { Injectable, Logger, BadRequestException } from '@nestjs/common';
import { PaymentsService } from '@/payments/payments.service';
import { AuditService } from '@/audit/audit.service';
import { PaymentStatus, MNOProvider } from '@/common/enums/payment.enum';
import * as crypto from 'crypto';

@Injectable()
export class WebhooksService {
  private readonly logger = new Logger(WebhooksService.name);

  constructor(
    private readonly paymentsService: PaymentsService,
    private readonly auditService: AuditService,
  ) {}

  async handleMtnWebhook(payload: any, signature?: string): Promise<void> {
    try {
      // Verify webhook signature
      if (!this.verifyWebhookSignature(JSON.stringify(payload), signature, 'mtn')) {
        throw new BadRequestException('Invalid webhook signature');
      }

      const { transactionId, status, reference } = payload;
      
      this.logger.log(`Processing MTN webhook: ${transactionId}, status: ${status}`);

      // Map MTN status to internal status
      const paymentStatus = this.mapMtnStatus(status);
      
      if (paymentStatus) {
        await this.paymentsService.updatePaymentStatus(
          reference,
          paymentStatus,
          transactionId,
          payload,
        );
      }

      await this.auditService.log({
        action: 'webhook.mtn_received',
        resourceType: 'webhook',
        metadata: { payload, status: paymentStatus },
      });

    } catch (error) {
      this.logger.error(`MTN webhook processing failed: ${error.message}`);
      
      await this.auditService.log({
        action: 'webhook.mtn_failed',
        resourceType: 'webhook',
        metadata: { error: error.message, payload },
      });
      
      throw error;
    }
  }

  async handleAirtelWebhook(payload: any, signature?: string): Promise<void> {
    try {
      // Verify webhook signature
      if (!this.verifyWebhookSignature(JSON.stringify(payload), signature, 'airtel')) {
        throw new BadRequestException('Invalid webhook signature');
      }

      const { transactionId, status, reference } = payload;
      
      this.logger.log(`Processing Airtel webhook: ${transactionId}, status: ${status}`);

      // Map Airtel status to internal status
      const paymentStatus = this.mapAirtelStatus(status);
      
      if (paymentStatus) {
        await this.paymentsService.updatePaymentStatus(
          reference,
          paymentStatus,
          transactionId,
          payload,
        );
      }

      await this.auditService.log({
        action: 'webhook.airtel_received',
        resourceType: 'webhook',
        metadata: { payload, status: paymentStatus },
      });

    } catch (error) {
      this.logger.error(`Airtel webhook processing failed: ${error.message}`);
      
      await this.auditService.log({
        action: 'webhook.airtel_failed',
        resourceType: 'webhook',
        metadata: { error: error.message, payload },
      });
      
      throw error;
    }
  }

  private verifyWebhookSignature(payload: string, signature: string, provider: string): boolean {
    if (!signature) {
      return false;
    }

    try {
      const secret = process.env.WEBHOOK_SECRET;
      const expectedSignature = crypto
        .createHmac('sha256', secret)
        .update(payload)
        .digest('hex');

      return crypto.timingSafeEqual(
        Buffer.from(signature),
        Buffer.from(`sha256=${expectedSignature}`)
      );
    } catch (error) {
      this.logger.error(`Signature verification failed: ${error.message}`);
      return false;
    }
  }

  private mapMtnStatus(status: string): PaymentStatus | null {
    const statusMap: Record<string, PaymentStatus> = {
      'SUCCESSFUL': PaymentStatus.COMPLETED,
      'FAILED': PaymentStatus.FAILED,
      'PENDING': PaymentStatus.PENDING,
      'CANCELLED': PaymentStatus.FAILED,
      'EXPIRED': PaymentStatus.EXPIRED,
    };

    return statusMap[status] || null;
  }

  private mapAirtelStatus(status: string): PaymentStatus | null {
    const statusMap: Record<string, PaymentStatus> = {
      'SUCCESS': PaymentStatus.COMPLETED,
      'FAILED': PaymentStatus.FAILED,
      'PENDING': PaymentStatus.PENDING,
      'CANCELLED': PaymentStatus.FAILED,
      'EXPIRED': PaymentStatus.EXPIRED,
    };

    return statusMap[status] || null;
  }
}