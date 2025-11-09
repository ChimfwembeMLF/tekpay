import { Job } from 'bull';
import { Repository } from 'typeorm';
import { Payment } from '@/payments/entities/payment.entity';
import { Transaction } from '@/payments/entities/transaction.entity';
import { MnoService } from '@/mno/mno.service';
import { AuditService } from '@/audit/audit.service';
export declare class ReconciliationProcessor {
    private readonly paymentRepository;
    private readonly transactionRepository;
    private readonly mnoService;
    private readonly auditService;
    private readonly logger;
    constructor(paymentRepository: Repository<Payment>, transactionRepository: Repository<Transaction>, mnoService: MnoService, auditService: AuditService);
    handleDailyReconciliation(job: Job): Promise<{
        date: string;
        totalPayments: number;
        reconciled: number;
        discrepancies: number;
        timestamp: string;
    }>;
    handlePaymentStatusCheck(job: Job): Promise<void>;
    private mapStatusToInternal;
}
