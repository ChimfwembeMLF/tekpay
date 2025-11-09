import { AdminService } from './admin.service';
import { PaymentStatus, MNOProvider } from '@/common/enums/payment.enum';
import { CreateClientDto, UpdateClientDto, ClientStatusDto } from './dto/client.dto';
export declare class AdminController {
    private readonly adminService;
    constructor(adminService: AdminService);
    getDashboard(dateFrom?: string, dateTo?: string): Promise<any>;
    getTrends(days?: number): Promise<any>;
    getTopConsumers(limit?: number): Promise<any>;
    searchPayments(status?: PaymentStatus, mno?: MNOProvider, consumerId?: string, phoneNumber?: string, amountMin?: number, amountMax?: number, dateFrom?: string, dateTo?: string, limit?: number, offset?: number): Promise<{
        payments: import("../payments/entities/payment.entity").Payment[];
        total: number;
    }>;
    getClients(page?: number, limit?: number, search?: string, status?: boolean): Promise<{
        clients: any[];
        total: number;
        page: number;
        totalPages: number;
    }>;
    getClientById(id: string): Promise<any>;
    createClient(createClientDto: CreateClientDto): Promise<any>;
    updateClient(id: string, updateClientDto: UpdateClientDto): Promise<any>;
    updateClientStatus(id: string, statusDto: ClientStatusDto): Promise<any>;
    deleteClient(id: string): Promise<{
        message: string;
    }>;
    regenerateApiKey(id: string): Promise<{
        apiKey: string;
    }>;
    getClientAnalytics(id: string, dateFrom?: string, dateTo?: string): Promise<any>;
    getClientUsage(id: string, month?: string): Promise<any>;
    getClientPayments(id: string, page?: number, limit?: number, status?: PaymentStatus): Promise<{
        payments: import("../payments/entities/payment.entity").Payment[];
        total: number;
        page: number;
        totalPages: number;
    }>;
    getSystemHealth(): Promise<any>;
    getSystemMetrics(hours?: number): Promise<any>;
    getAlerts(severity?: string, limit?: number): Promise<any[]>;
}
