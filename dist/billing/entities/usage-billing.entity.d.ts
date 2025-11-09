import { BaseEntity } from '@/common/entities/base.entity';
import { ApiConsumer } from '@/auth/entities/api-consumer.entity';
export declare class UsageBilling extends BaseEntity {
    consumer: ApiConsumer;
    consumerId: string;
    apiCalls: number;
    totalVolume: number;
    billingPeriod: string;
    charges: number;
    lastUpdated: Date;
}
