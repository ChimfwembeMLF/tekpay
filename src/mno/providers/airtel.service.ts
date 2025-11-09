import { Injectable, Logger } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { ConfigService } from '@nestjs/config';
import { PaymentRequest, PaymentResponse } from '../mno.service';
import { v4 as uuidv4 } from 'uuid';

@Injectable()
export class AirtelService {
  private readonly logger = new Logger(AirtelService.name);
  private readonly baseUrl: string;
  private readonly clientId: string;
  private readonly clientSecret: string;

  constructor(
    private readonly httpService: HttpService,
    private readonly configService: ConfigService,
  ) {
    this.baseUrl = this.configService.get<string>('AIRTEL_BASE_URL');
    this.clientId = this.configService.get<string>('AIRTEL_CLIENT_ID');
    this.clientSecret = this.configService.get<string>('AIRTEL_CLIENT_SECRET');
  }

  async initiatePayment(request: PaymentRequest): Promise<PaymentResponse> {
    try {
      this.logger.log(`Initiating Airtel payment for ${request.phoneNumber}`);

      // Get access token first
      const accessToken = await this.getAccessToken();

      // Prepare payment request
      const paymentData = {
        reference: request.externalReference || uuidv4(),
        subscriber: {
          country: 'ZM',
          currency: 'ZMW',
          msisdn: this.formatPhoneNumber(request.phoneNumber),
        },
        transaction: {
          amount: request.amount,
          country: 'ZM',
          currency: 'ZMW',
          id: uuidv4(),
        },
      };

      // Make API call to Airtel
      const response = await this.httpService.post(
        `${this.baseUrl}/merchant/v1/payments/`,
        paymentData,
        {
          headers: {
            'Authorization': `Bearer ${accessToken}`,
            'Content-Type': 'application/json',
            'X-Country': 'ZM',
            'X-Currency': 'ZMW',
          },
          timeout: 30000,
        }
      ).toPromise();

      const data = response.data;

      if (data.status && data.status.success) {
        this.logger.log(`Airtel payment initiated successfully: ${data.data.transaction.id}`);

        return {
          success: true,
          reference: data.data.transaction.id,
          transactionId: data.data.transaction.id,
          message: data.status.message || 'Payment initiated successfully',
        };
      } else {
        throw new Error(data.status?.message || 'Payment initiation failed');
      }
    } catch (error) {
      this.logger.error(`Airtel payment initiation failed: ${error.message}`);

      return {
        success: false,
        reference: `airtel_failed_${Date.now()}`,
        message: error.response?.data?.status?.message || error.message,
      };
    }
  }

  async checkPaymentStatus(reference: string): Promise<any> {
    try {
      this.logger.log(`Checking Airtel payment status: ${reference}`);

      // Get access token
      const accessToken = await this.getAccessToken();

      // Make API call to check status
      const response = await this.httpService.get(
        `${this.baseUrl}/standard/v1/payments/${reference}`,
        {
          headers: {
            'Authorization': `Bearer ${accessToken}`,
            'X-Country': 'ZM',
            'X-Currency': 'ZMW',
          },
          timeout: 15000,
        }
      ).toPromise();

      const data = response.data;

      if (data.status && data.status.success) {
        return {
          reference,
          status: this.mapAirtelStatus(data.data.transaction.status),
          amount: parseFloat(data.data.transaction.amount),
          currency: data.data.transaction.currency,
          transactionId: data.data.transaction.id,
          timestamp: data.data.transaction.created_at || new Date().toISOString(),
        };
      } else {
        throw new Error(data.status?.message || 'Failed to check payment status');
      }
    } catch (error) {
      this.logger.error(`Airtel status check failed: ${error.message}`);

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
      this.logger.log(`Processing Airtel refund: ${paymentReference}, amount: ${amount}`);

      // Get access token
      const accessToken = await this.getAccessToken();
      const refundId = uuidv4();

      // Prepare refund request
      const refundData = {
        transaction: {
          amount: amount,
          country: 'ZM',
          currency: 'ZMW',
          id: refundId,
        },
        reference: {
          transaction: paymentReference,
        },
      };

      // Make API call to process refund
      const response = await this.httpService.post(
        `${this.baseUrl}/standard/v1/payments/refund`,
        refundData,
        {
          headers: {
            'Authorization': `Bearer ${accessToken}`,
            'Content-Type': 'application/json',
            'X-Country': 'ZM',
            'X-Currency': 'ZMW',
          },
          timeout: 30000,
        }
      ).toPromise();

      const data = response.data;

      if (data.status && data.status.success) {
        return {
          success: true,
          refundId: data.data.transaction.id,
          amount,
          status: 'processing',
          message: data.status.message || 'Refund initiated successfully',
        };
      } else {
        throw new Error(data.status?.message || 'Refund processing failed');
      }
    } catch (error) {
      this.logger.error(`Airtel refund failed: ${error.message}`);
      throw error;
    }
  }

  private async getAccessToken(): Promise<string> {
    try {
      const response = await this.httpService.post(
        `${this.baseUrl}/auth/oauth2/token`,
        {
          client_id: this.clientId,
          client_secret: this.clientSecret,
          grant_type: 'client_credentials',
        },
        {
          headers: {
            'Content-Type': 'application/json',
          },
          timeout: 15000,
        }
      ).toPromise();

      return response.data.access_token;
    } catch (error) {
      this.logger.error(`Failed to get Airtel access token: ${error.message}`);
      throw new Error('Failed to authenticate with Airtel API');
    }
  }

  private formatPhoneNumber(phoneNumber: string): string {
    // Remove any non-digit characters
    let cleaned = phoneNumber.replace(/\D/g, '');

    // If it starts with 260 (Zambia country code), keep it
    if (cleaned.startsWith('260')) {
      return cleaned;
    }

    // If it doesn't start with 260, add it
    if (cleaned.startsWith('9') || cleaned.startsWith('7')) {
      return '260' + cleaned;
    }

    // Default case - assume it needs 260 prefix
    return '260' + cleaned;
  }

  private mapAirtelStatus(airtelStatus: string): string {
    const statusMap = {
      'TS': 'completed', // Transaction Successful
      'TF': 'failed',    // Transaction Failed
      'TA': 'pending',   // Transaction Ambiguous
      'TI': 'pending',   // Transaction Initiated
      'TP': 'pending',   // Transaction Pending
    };

    return statusMap[airtelStatus] || 'unknown';
  }
}