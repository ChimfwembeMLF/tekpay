import { Injectable } from '@nestjs/common';
import { MNOProvider } from '@/common/enums/payment.enum';
import { MtnService } from './providers/mtn.service';
import { AirtelService } from './providers/airtel.service';

export interface PaymentRequest {
  amount: number;
  phoneNumber: string;
  mno: MNOProvider;
  reference: string;
  externalReference?: string;
}

export interface PaymentResponse {
  success: boolean;
  reference: string;
  transactionId?: string;
  message?: string;
}

@Injectable()
export class MnoService {
  constructor(
    private readonly mtnService: MtnService,
    private readonly airtelService: AirtelService,
  ) {}

  async initiatePayment(request: PaymentRequest): Promise<PaymentResponse> {
    switch (request.mno) {
      case MNOProvider.MTN:
        return await this.mtnService.initiatePayment(request);
      case MNOProvider.AIRTEL:
        return await this.airtelService.initiatePayment(request);
      default:
        throw new Error(`Unsupported MNO: ${request.mno}`);
    }
  }

  async checkPaymentStatus(reference: string, mno: MNOProvider): Promise<any> {
    switch (mno) {
      case MNOProvider.MTN:
        return await this.mtnService.checkPaymentStatus(reference);
      case MNOProvider.AIRTEL:
        return await this.airtelService.checkPaymentStatus(reference);
      default:
        throw new Error(`Unsupported MNO: ${mno}`);
    }
  }

  async processRefund(paymentReference: string, amount: number, mno: MNOProvider): Promise<any> {
    switch (mno) {
      case MNOProvider.MTN:
        return await this.mtnService.processRefund(paymentReference, amount);
      case MNOProvider.AIRTEL:
        return await this.airtelService.processRefund(paymentReference, amount);
      default:
        throw new Error(`Unsupported MNO: ${mno}`);
    }
  }
}