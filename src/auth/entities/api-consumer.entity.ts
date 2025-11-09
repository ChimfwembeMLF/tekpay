import { Entity, Column, OneToMany } from 'typeorm';
import { BaseEntity } from '@/common/entities/base.entity';
import { PricingPlan } from '@/common/enums/payment.enum';
import { Payment } from '@/payments/entities/payment.entity';
import { UsageBilling } from '@/billing/entities/usage-billing.entity';

@Entity('api_consumers')
export class ApiConsumer extends BaseEntity {
  @Column({ unique: true })
  name: string;

  @Column({ unique: true })
  email: string;

  @Column({ name: 'api_key', unique: true })
  apiKey: string;

  @Column({
    type: 'enum',
    enum: PricingPlan,
    default: PricingPlan.STANDARD,
    name: 'pricing_plan',
  })
  pricingPlan: PricingPlan;

  @Column({ name: 'monthly_quota', default: 10000 })
  monthlyQuota: number;

  @Column({ name: 'is_active', default: true })
  isActive: boolean;

  @Column({ type: 'jsonb', nullable: true })
  metadata: any;

  @OneToMany(() => Payment, (payment) => payment.consumer)
  payments: Payment[];

  @OneToMany(() => UsageBilling, (usage) => usage.consumer)
  usageBilling: UsageBilling[];
}