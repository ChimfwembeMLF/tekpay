import { PricingPlan } from '@/common/enums/payment.enum';
export declare class CreateConsumerDto {
    name: string;
    email: string;
    pricingPlan?: PricingPlan;
    monthlyQuota?: number;
}
