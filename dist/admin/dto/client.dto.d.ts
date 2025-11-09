import { PricingPlan } from '@/common/enums/payment.enum';
export declare class CreateClientDto {
    name: string;
    email: string;
    description: string;
    webhookUrl: string;
    pricingPlan?: PricingPlan;
    isActive?: boolean;
    contactInfo?: string;
    address?: string;
}
export declare class UpdateClientDto {
    name?: string;
    email?: string;
    description?: string;
    webhookUrl?: string;
    pricingPlan?: PricingPlan;
    contactInfo?: string;
    address?: string;
}
export declare class ClientStatusDto {
    isActive: boolean;
}
export declare class ClientResponseDto {
    id: string;
    name: string;
    email: string;
    description: string;
    webhookUrl: string;
    apiKey: string;
    pricingPlan: PricingPlan;
    isActive: boolean;
    contactInfo?: string;
    address?: string;
    createdAt: Date;
    updatedAt: Date;
    lastActivityAt?: Date;
    totalPayments: number;
    totalVolume: number;
    successRate: number;
}
export declare class ClientAnalyticsDto {
    client: ClientResponseDto;
    paymentStats: {
        total: number;
        completed: number;
        failed: number;
        pending: number;
        successRate: number;
    };
    volumeStats: {
        total: number;
        currency: string;
        averageTransaction: number;
    };
    mnoDistribution: {
        mtn: number;
        airtel: number;
    };
    dailyTrends: Array<{
        date: string;
        count: number;
        volume: number;
        successRate: number;
    }>;
    billing: {
        currentMonth: number;
        previousMonth: number;
        totalCost: number;
    };
}
