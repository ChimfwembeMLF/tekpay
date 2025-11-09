import { BillingService } from './billing.service';
import { ApiConsumer } from '@/auth/entities/api-consumer.entity';
export declare class BillingController {
    private readonly billingService;
    constructor(billingService: BillingService);
    getUsage(consumer: ApiConsumer, period?: string): Promise<{
        billingPeriod: string;
        apiCalls: number;
        totalVolume: number;
        charges: number;
        plan: import("../common/enums/payment.enum").PricingPlan;
        monthlyQuota: number;
        quotaUsagePercentage: number;
        lastUpdated: Date;
    }>;
}
