import { INestApplication } from '@nestjs/common';
import { ApiConsumer } from '../auth/entities/api-consumer.entity';
import { Payment } from '../payments/entities/payment.entity';
import { Transaction } from '../payments/entities/transaction.entity';
import { UsageBilling } from '../billing/entities/usage-billing.entity';
import { PaymentStatus } from '../common/enums/payment.enum';
export declare class TestUtils {
    static createTestingApp(): Promise<INestApplication>;
    static createTestConsumer(app: INestApplication, overrides?: Partial<ApiConsumer>): Promise<ApiConsumer>;
    static createTestPayment(app: INestApplication, consumer: ApiConsumer, overrides?: Partial<Payment>): Promise<Payment>;
    static createTestTransaction(app: INestApplication, payment: Payment, overrides?: Partial<Transaction>): Promise<Transaction>;
    static createTestUsageBilling(app: INestApplication, consumer: ApiConsumer, overrides?: Partial<UsageBilling>): Promise<UsageBilling>;
    static generateApiKey(): string;
    static cleanupDatabase(app: INestApplication): Promise<void>;
    static createMockMtnResponse(success?: boolean): {
        success: boolean;
        reference: string;
        transactionId: string;
        message: string;
    } | {
        success: boolean;
        reference: string;
        message: string;
        transactionId?: undefined;
    };
    static createMockAirtelResponse(success?: boolean): {
        success: boolean;
        reference: string;
        transactionId: string;
        message: string;
    } | {
        success: boolean;
        reference: string;
        message: string;
        transactionId?: undefined;
    };
    static createMockWebhookPayload(paymentId: string, status: PaymentStatus): {
        paymentId: string;
        status: PaymentStatus;
        amount: number;
        currency: string;
        externalReference: string;
        timestamp: string;
    };
    static waitForJobCompletion(ms?: number): Promise<void>;
}
