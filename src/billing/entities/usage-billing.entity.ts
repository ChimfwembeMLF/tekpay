import { Entity, Column, ManyToOne, JoinColumn, Index } from 'typeorm';
import { BaseEntity } from '@/common/entities/base.entity';
import { ApiConsumer } from '@/auth/entities/api-consumer.entity';

@Entity('usage_billing')
@Index(['consumerId', 'billingPeriod'], { unique: true })
export class UsageBilling extends BaseEntity {
  @ManyToOne(() => ApiConsumer, (consumer) => consumer.usageBilling)
  @JoinColumn({ name: 'consumer_id' })
  consumer: ApiConsumer;

  @Column({ name: 'consumer_id' })
  consumerId: string;

  @Column({ name: 'api_calls', default: 0 })
  apiCalls: number;

  @Column({ name: 'total_volume', type: 'decimal', precision: 12, scale: 2, default: 0 })
  totalVolume: number;

  @Column({ name: 'billing_period' })
  billingPeriod: string; // YYYY-MM format

  @Column({ type: 'decimal', precision: 12, scale: 2, default: 0 })
  charges: number;

  @Column({ name: 'last_updated', type: 'timestamptz', default: () => 'CURRENT_TIMESTAMP' })
  lastUpdated: Date;
}