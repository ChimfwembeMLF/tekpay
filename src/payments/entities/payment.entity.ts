import { Entity, Column, ManyToOne, OneToMany, JoinColumn } from 'typeorm';
import { BaseEntity } from '@/common/entities/base.entity';
import { PaymentStatus, MNOProvider, Currency } from '@/common/enums/payment.enum';
import { ApiConsumer } from '@/auth/entities/api-consumer.entity';
import { Transaction } from './transaction.entity';

@Entity('payments')
export class Payment extends BaseEntity {
  @ManyToOne(() => ApiConsumer, (consumer) => consumer.payments)
  @JoinColumn({ name: 'consumer_id' })
  consumer: ApiConsumer;

  @Column({ name: 'consumer_id' })
  consumerId: string;

  @Column({ name: 'external_reference', nullable: true })
  externalReference: string;

  @Column({ type: 'decimal', precision: 12, scale: 2 })
  amount: number;

  @Column({
    type: 'enum',
    enum: Currency,
    default: Currency.ZMW,
  })
  currency: Currency;

  @Column({
    type: 'enum',
    enum: MNOProvider,
  })
  mno: MNOProvider;

  @Column({ name: 'phone_number' })
  phoneNumber: string;

  @Column({
    type: 'enum',
    enum: PaymentStatus,
    default: PaymentStatus.CREATED,
  })
  status: PaymentStatus;

  @Column({ name: 'mno_reference', nullable: true })
  mnoReference: string;

  @Column({ type: 'jsonb', nullable: true })
  metadata: any;

  @Column({ name: 'expires_at', type: 'timestamptz', nullable: true })
  expiresAt: Date;

  @Column({ name: 'callback_url', nullable: true })
  callbackUrl: string;

  @Column({ name: 'idempotency_key', nullable: true })
  idempotencyKey: string;

  @OneToMany(() => Transaction, (transaction) => transaction.payment)
  transactions: Transaction[];
}