import { Processor, Process } from '@nestjs/bull';
import { Logger } from '@nestjs/common';
import { Job } from 'bull';
import { PaymentsService } from '@/payments/payments.service';
import { HttpService } from '@nestjs/axios';

@Processor('payments')
export class PaymentProcessor {
  private readonly logger = new Logger(PaymentProcessor.name);

  constructor(
    private readonly paymentsService: PaymentsService,
    private readonly httpService: HttpService,
  ) {}

  @Process('initiate-payment')
  async handlePaymentInitiation(job: Job) {
    const { paymentId } = job.data;
    
    try {
      this.logger.log(`Processing payment initiation: ${paymentId}`);
      await this.paymentsService.initiatePayment(paymentId);
      this.logger.log(`Payment initiated successfully: ${paymentId}`);
    } catch (error) {
      this.logger.error(`Payment initiation failed: ${paymentId}`, error);
      throw error;
    }
  }

  @Process('process-refund')
  async handleRefundProcessing(job: Job) {
    const { refundId, paymentId } = job.data;
    
    try {
      this.logger.log(`Processing refund: ${refundId} for payment: ${paymentId}`);
      
      // In a real implementation, you would call the MNO refund API
      // For now, we'll simulate the process
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      this.logger.log(`Refund processed successfully: ${refundId}`);
    } catch (error) {
      this.logger.error(`Refund processing failed: ${refundId}`, error);
      throw error;
    }
  }

  @Process('send-callback')
  async handleCallbackNotification(job: Job) {
    const { paymentId, callbackUrl, status } = job.data;
    
    try {
      this.logger.log(`Sending callback for payment: ${paymentId}`);
      
      const payment = await this.paymentsService.getPayment(paymentId);
      
      const payload = {
        paymentId: payment.id,
        status,
        amount: payment.amount,
        currency: payment.currency,
        externalReference: payment.externalReference,
        timestamp: new Date().toISOString(),
      };

      await this.httpService.post(callbackUrl, payload, {
        timeout: 10000,
        headers: {
          'Content-Type': 'application/json',
          'User-Agent': 'TekPay-Gateway/1.0',
        },
      }).toPromise();

      this.logger.log(`Callback sent successfully for payment: ${paymentId}`);
    } catch (error) {
      this.logger.error(`Callback failed for payment: ${paymentId}`, error);
      
      // Retry logic could be implemented here
      if (job.attemptsMade < 3) {
        throw error; // This will trigger a retry
      }
    }
  }
}