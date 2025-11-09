import { Repository } from 'typeorm';
import { UsageBilling } from './entities/usage-billing.entity';
import { ApiConsumer } from '@/auth/entities/api-consumer.entity';
export declare class BillingService {
    private readonly usageBillingRepository;
    constructor(usageBillingRepository: Repository<UsageBilling>);
    logApiUsage(consumerId: string, calls: number, volume: number): Promise<void>;
    getUsage(consumerId: string, period?: string): Promise<UsageBilling>;
    calculateCharges(consumer: ApiConsumer, usage: UsageBilling): Promise<number>;
    updateCharges(consumerId: string, period?: string): Promise<void>;
    private getCurrentBillingPeriod;
    private getPricingRates;
}
