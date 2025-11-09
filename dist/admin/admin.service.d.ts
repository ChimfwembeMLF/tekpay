import { Repository } from 'typeorm';
import { Payment } from '@/payments/entities/payment.entity';
import { Transaction } from '@/payments/entities/transaction.entity';
import { ApiConsumer } from '@/auth/entities/api-consumer.entity';
import { UsageBilling } from '@/billing/entities/usage-billing.entity';
import { PaymentStatus } from '@/common/enums/payment.enum';
import { CreateClientDto, UpdateClientDto } from './dto/client.dto';
export declare class AdminService {
    private readonly paymentRepository;
    private readonly transactionRepository;
    private readonly apiConsumerRepository;
    private readonly usageBillingRepository;
    constructor(paymentRepository: Repository<Payment>, transactionRepository: Repository<Transaction>, apiConsumerRepository: Repository<ApiConsumer>, usageBillingRepository: Repository<UsageBilling>);
    getDashboardStats(dateFrom?: Date, dateTo?: Date): Promise<any>;
    getPaymentTrends(days?: number): Promise<any>;
    getTopConsumers(limit?: number): Promise<any>;
    searchPayments(filters: {
        status?: PaymentStatus;
        mno?: string;
        consumerId?: string;
        phoneNumber?: string;
        amountMin?: number;
        amountMax?: number;
        dateFrom?: Date;
        dateTo?: Date;
        limit?: number;
        offset?: number;
    }): Promise<{
        payments: Payment[];
        total: number;
    }>;
    getClients(filters: {
        page: number;
        limit: number;
        search?: string;
        status?: boolean;
    }): Promise<{
        clients: any[];
        total: number;
        page: number;
        totalPages: number;
    }>;
    getClientById(id: string): Promise<any>;
    createClient(createClientDto: CreateClientDto): Promise<any>;
    updateClient(id: string, updateClientDto: UpdateClientDto): Promise<any>;
    updateClientStatus(id: string, isActive: boolean): Promise<any>;
    deleteClient(id: string): Promise<{
        message: string;
    }>;
    regenerateApiKey(id: string): Promise<{
        apiKey: string;
    }>;
    private generateApiKey;
    private maskApiKey;
    getClientAnalytics(filters: {
        clientId: string;
        dateFrom?: Date;
        dateTo?: Date;
    }): Promise<any>;
    getClientUsage(clientId: string, month?: string): Promise<any>;
    getClientPayments(clientId: string, filters: {
        page: number;
        limit: number;
        status?: PaymentStatus;
    }): Promise<{
        payments: Payment[];
        total: number;
        page: number;
        totalPages: number;
    }>;
    getSystemHealth(): Promise<any>;
    getSystemMetrics(hours?: number): Promise<any>;
    getAlerts(filters: {
        severity?: string;
        limit: number;
    }): Promise<any[]>;
}
