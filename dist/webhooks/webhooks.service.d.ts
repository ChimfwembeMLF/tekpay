import { PaymentsService } from '@/payments/payments.service';
import { AuditService } from '@/audit/audit.service';
export declare class WebhooksService {
    private readonly paymentsService;
    private readonly auditService;
    private readonly logger;
    constructor(paymentsService: PaymentsService, auditService: AuditService);
    handleMtnWebhook(payload: any, signature?: string): Promise<void>;
    handleAirtelWebhook(payload: any, signature?: string): Promise<void>;
    private verifyWebhookSignature;
    private mapMtnStatus;
    private mapAirtelStatus;
}
