import { BaseEntity } from '@/common/entities/base.entity';
import { TransactionType, Currency } from '@/common/enums/payment.enum';
import { Payment } from './payment.entity';
export declare class Transaction extends BaseEntity {
    payment: Payment;
    paymentId: string;
    mnoTransactionId: string;
    type: TransactionType;
    amount: number;
    currency: Currency;
    status: string;
    rawPayload: any;
    processedAt: Date;
}
