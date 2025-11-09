import { Injectable, Logger } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { ConfigService } from '@nestjs/config';
import { PaymentRequest, PaymentResponse } from '../mno.service';
import { v4 as uuidv4 } from 'uuid';

@Injectable()
export class MtnService {
  private readonly logger = new Logger(MtnService.name);
  private readonly baseUrl: string;
  private readonly clientId: string;
  private readonly clientSecret: string;
  private readonly subscriptionKey: string;

  constructor(
    private readonly httpService: HttpService,
    private readonly configService: ConfigService,
  ) {
    this.baseUrl = this.configService.get<string>('MTN_BASE_URL');
    this.clientId = this.configService.get<string>('MTN_CLIENT_ID');
    this.clientSecret = this.configService.get<string>('MTN_CLIENT_SECRET');
    this.subscriptionKey = this.configService.get<string>('MTN_SUBSCRIPTION_KEY');
  }

  async initiatePayment(request: PaymentRequest): Promise<PaymentResponse> {
    try {
      this.logger.log(`Initiating MTN payment for ${request.phoneNumber}`);

      // Get access token first
      const accessToken = await this.getAccessToken();

      // Prepare payment request
      const paymentData = {
        amount: request.amount.toString(),
        currency: 'ZMW',
        externalId: request.externalReference || uuidv4(),
        payer: {
          partyIdType: 'MSISDN',
          partyId: this.formatPhoneNumber(request.phoneNumber),
        },
        payerMessage: 'Payment request',
        payeeNote: `Payment for ${request.externalReference || 'order'}`,
      };

      const requestId = uuidv4();
      const targetEnvironment = this.configService.get<string>('MTN_ENVIRONMENT', 'sandbox');

      // Make API call to MTN
      const response = await this.httpService.post(
        `${this.baseUrl}/collection/v1_0/requesttopay`,
        paymentData,
        {
          headers: {
            'Authorization': `Bearer ${accessToken}`,
            'X-Reference-Id': requestId,
            'X-Target-Environment': targetEnvironment,
            'Ocp-Apim-Subscription-Key': this.subscriptionKey,
            'Content-Type': 'application/json',
          },
          timeout: 30000,
        }
      ).toPromise();

      if (response.status === 202) {
        this.logger.log(`MTN payment initiated successfully: ${requestId}`);

        return {
          success: true,
          reference: requestId,
          transactionId: requestId,
          message: 'Payment initiated successfully',
        };
      } else {
        throw new Error(`Unexpected response status: ${response.status}`);
      }
    } catch (error) {
      this.logger.error(`MTN payment initiation failed: ${error.message}`);

      return {
        success: false,
        reference: `mtn_failed_${Date.now()}`,
        message: error.response?.data?.message || error.message,
      };
    }
  }

  async checkPaymentStatus(reference: string): Promise<any> {
    try {
      this.logger.log(`Checking MTN payment status: ${reference}`);

      // Get access token
      const accessToken = await this.getAccessToken();
      const targetEnvironment = this.configService.get<string>('MTN_ENVIRONMENT', 'sandbox');

      // Make API call to check status
      const response = await this.httpService.get(
        `${this.baseUrl}/collection/v1_0/requesttopay/${reference}`,
        {
          headers: {
            'Authorization': `Bearer ${accessToken}`,
            'X-Target-Environment': targetEnvironment,
            'Ocp-Apim-Subscription-Key': this.subscriptionKey,
          },
          timeout: 15000,
        }
      ).toPromise();

      const data = response.data;

      return {
        reference,
        status: this.mapMtnStatus(data.status),
        amount: parseFloat(data.amount),
        currency: data.currency,
        externalId: data.externalId,
        payerMessage: data.payerMessage,
        payeeNote: data.payeeNote,
        timestamp: data.createdAt || new Date().toISOString(),
      };
    } catch (error) {
      this.logger.error(`MTN status check failed: ${error.message}`);

      if (error.response?.status === 404) {
        return {
          reference,
          status: 'not_found',
          message: 'Payment not found',
        };
      }

      throw error;
    }
  }

  async processRefund(paymentReference: string, amount: number): Promise<any> {
    try {
      this.logger.log(`Processing MTN refund: ${paymentReference}, amount: ${amount}`);

      // Get access token
      const accessToken = await this.getAccessToken();
      const refundId = uuidv4();
      const targetEnvironment = this.configService.get<string>('MTN_ENVIRONMENT', 'sandbox');

      // Prepare refund request
      const refundData = {
        amount: amount.toString(),
        currency: 'ZMW',
        externalId: refundId,
        payerMessage: 'Refund processed',
        payeeNote: `Refund for payment ${paymentReference}`,
      };

      // Make API call to process refund
      const response = await this.httpService.post(
        `${this.baseUrl}/collection/v1_0/refund`,
        refundData,
        {
          headers: {
            'Authorization': `Bearer ${accessToken}`,
            'X-Reference-Id': refundId,
            'X-Target-Environment': targetEnvironment,
            'Ocp-Apim-Subscription-Key': this.subscriptionKey,
            'Content-Type': 'application/json',
          },
          timeout: 30000,
        }
      ).toPromise();

      if (response.status === 202) {
        return {
          success: true,
          refundId,
          amount,
          status: 'processing',
          message: 'Refund initiated successfully',
        };
      } else {
        throw new Error(`Unexpected response status: ${response.status}`);
      }
    } catch (error) {
      this.logger.error(`MTN refund failed: ${error.message}`);
      throw error;
    }
  }

  private async getAccessToken(): Promise<string> {
    try {
      const response = await this.httpService.post(
        `${this.baseUrl}/collection/token/`,
        {},
        {
          headers: {
            'Authorization': `Basic ${Buffer.from(`${this.clientId}:${this.clientSecret}`).toString('base64')}`,
            'Ocp-Apim-Subscription-Key': this.subscriptionKey,
          },
          timeout: 15000,
        }
      ).toPromise();

      return response.data.access_token;
    } catch (error) {
      this.logger.error(`Failed to get MTN access token: ${error.message}`);
      throw new Error('Failed to authenticate with MTN API');
    }
  }

  private formatPhoneNumber(phoneNumber: string): string {
    // Remove any non-digit characters
    let cleaned = phoneNumber.replace(/\D/g, '');

    // If it starts with 260 (Zambia country code), remove it
    if (cleaned.startsWith('260')) {
      cleaned = cleaned.substring(3);
    }

    // Ensure it starts with the correct prefix for Zambia
    if (!cleaned.startsWith('9')) {
      cleaned = '9' + cleaned.substring(1);
    }

    return cleaned;
  }

  private mapMtnStatus(mtnStatus: string): string {
    const statusMap = {
      'PENDING': 'pending',
      'SUCCESSFUL': 'completed',
      'FAILED': 'failed',
      'TIMEOUT': 'expired',
      'CANCELLED': 'failed',
    };

    return statusMap[mtnStatus] || 'unknown';
  }
}