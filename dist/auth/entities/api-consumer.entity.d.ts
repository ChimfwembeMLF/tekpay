import { BaseEntity } from '@/common/entities/base.entity';
import { PricingPlan } from '@/common/enums/payment.enum';
import { Payment } from '@/payments/entities/payment.entity';
import { UsageBilling } from '@/billing/entities/usage-billing.entity';
export declare class ApiConsumer extends BaseEntity {
    name: string;
    email: string;
    apiKey: string;
    pricingPlan: PricingPlan;
    monthlyQuota: number;
    isActive: boolean;
    metadata: any;
    payments: Payment[];
    usageBilling: UsageBilling[];
}
