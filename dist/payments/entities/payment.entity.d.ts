import { BaseEntity } from '@/common/entities/base.entity';
import { PaymentStatus, MNOProvider, Currency } from '@/common/enums/payment.enum';
import { ApiConsumer } from '@/auth/entities/api-consumer.entity';
import { Transaction } from './transaction.entity';
export declare class Payment extends BaseEntity {
    consumer: ApiConsumer;
    consumerId: string;
    externalReference: string;
    amount: number;
    currency: Currency;
    mno: MNOProvider;
    phoneNumber: string;
    status: PaymentStatus;
    mnoReference: string;
    metadata: any;
    expiresAt: Date;
    callbackUrl: string;
    idempotencyKey: string;
    transactions: Transaction[];
}
