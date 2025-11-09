import { MNOProvider } from '@/common/enums/payment.enum';
export declare class CreatePaymentDto {
    amount: number;
    mno: MNOProvider;
    phoneNumber: string;
    externalReference?: string;
    callbackUrl?: string;
    metadata?: any;
}
