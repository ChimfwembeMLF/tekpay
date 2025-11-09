import { Repository } from 'typeorm';
import { Queue } from 'bull';
import { Payment } from './entities/payment.entity';
import { Transaction } from './entities/transaction.entity';
import { ApiConsumer } from '@/auth/entities/api-consumer.entity';
import { CreatePaymentDto } from './dto/create-payment.dto';
import { RefundPaymentDto } from './dto/refund-payment.dto';
import { PaymentStatus } from '@/common/enums/payment.enum';
import { MnoService } from '@/mno/mno.service';
import { BillingService } from '@/billing/billing.service';
import { AuditService } from '@/audit/audit.service';
export declare class PaymentsService {
    private readonly paymentRepository;
    private readonly transactionRepository;
    private readonly paymentsQueue;
    private readonly mnoService;
    private readonly billingService;
    private readonly auditService;
    constructor(paymentRepository: Repository<Payment>, transactionRepository: Repository<Transaction>, paymentsQueue: Queue, mnoService: MnoService, billingService: BillingService, auditService: AuditService);
    createPayment(createPaymentDto: CreatePaymentDto, consumer: ApiConsumer, idempotencyKey?: string): Promise<Payment>;
    initiatePayment(paymentId: string): Promise<void>;
    getPayment(id: string, consumerId?: string): Promise<Payment>;
    listPayments(consumerId: string, filters?: {
        status?: PaymentStatus;
        dateFrom?: Date;
        dateTo?: Date;
        limit?: number;
        offset?: number;
    }): Promise<{
        payments: Payment[];
        total: number;
    }>;
    refundPayment(paymentId: string, refundDto: RefundPaymentDto, consumerId: string, idempotencyKey?: string): Promise<Transaction>;
    updatePaymentStatus(paymentId: string, status: PaymentStatus, mnoTransactionId?: string, metadata?: any): Promise<void>;
}
