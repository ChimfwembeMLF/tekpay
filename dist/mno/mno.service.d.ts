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
export declare class MnoService {
    private readonly mtnService;
    private readonly airtelService;
    constructor(mtnService: MtnService, airtelService: AirtelService);
    initiatePayment(request: PaymentRequest): Promise<PaymentResponse>;
    checkPaymentStatus(reference: string, mno: MNOProvider): Promise<any>;
    processRefund(paymentReference: string, amount: number, mno: MNOProvider): Promise<any>;
}
