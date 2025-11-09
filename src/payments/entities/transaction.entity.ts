import { Entity, Column, ManyToOne, JoinColumn } from 'typeorm';
import { BaseEntity } from '@/common/entities/base.entity';
import { TransactionType, Currency } from '@/common/enums/payment.enum';
import { Payment } from './payment.entity';

@Entity('transactions')
export class Transaction extends BaseEntity {
  @ManyToOne(() => Payment, (payment) => payment.transactions)
  @JoinColumn({ name: 'payment_id' })
  payment: Payment;

  @Column({ name: 'payment_id', nullable: true })
  paymentId: string;

  @Column({ name: 'mno_transaction_id', nullable: true })
  mnoTransactionId: string;

  @Column({
    type: 'enum',
    enum: TransactionType,
  })
  type: TransactionType;

  @Column({ type: 'decimal', precision: 12, scale: 2 })
  amount: number;

  @Column({
    type: 'enum',
    enum: Currency,
    default: Currency.ZMW,
  })
  currency: Currency;

  @Column()
  status: string;

  @Column({ type: 'jsonb', nullable: true, name: 'raw_payload' })
  rawPayload: any;

  @Column({ name: 'processed_at', type: 'timestamptz', nullable: true })
  processedAt: Date;
}