import { PaymentsService } from './payments.service';
import { CreatePaymentDto } from './dto/create-payment.dto';
import { RefundPaymentDto } from './dto/refund-payment.dto';
import { ApiConsumer } from '@/auth/entities/api-consumer.entity';
import { PaymentStatus } from '@/common/enums/payment.enum';
export declare class PaymentsController {
    private readonly paymentsService;
    constructor(paymentsService: PaymentsService);
    createPayment(createPaymentDto: CreatePaymentDto, consumer: ApiConsumer, idempotencyKey?: string): Promise<{
        id: string;
        amount: number;
        currency: import("@/common/enums/payment.enum").Currency;
        mno: import("@/common/enums/payment.enum").MNOProvider;
        phoneNumber: string;
        status: PaymentStatus;
        externalReference: string;
        expiresAt: Date;
        createdAt: Date;
    }>;
    getPayment(id: string, consumer: ApiConsumer): Promise<import("./entities/payment.entity").Payment>;
    listPayments(consumer: ApiConsumer, status?: PaymentStatus, dateFrom?: string, dateTo?: string, limit?: number, offset?: number): Promise<{
        payments: import("./entities/payment.entity").Payment[];
        total: number;
    }>;
    refundPayment(id: string, refundDto: RefundPaymentDto, consumer: ApiConsumer, idempotencyKey?: string): Promise<import("./entities/transaction.entity").Transaction>;
}
