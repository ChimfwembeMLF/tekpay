import { WebhooksService } from './webhooks.service';
export declare class WebhooksController {
    private readonly webhooksService;
    constructor(webhooksService: WebhooksService);
    handleMtnWebhook(payload: any, signature?: string): Promise<{
        success: boolean;
    }>;
    handleAirtelWebhook(payload: any, signature?: string): Promise<{
        success: boolean;
    }>;
}
