import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bull';
import { PaymentProcessor } from './processors/payment.processor';
import { ReconciliationProcessor } from './processors/reconciliation.processor';
import { PaymentsModule } from '@/payments/payments.module';
import { MnoModule } from '@/mno/mno.module';
import { BillingModule } from '@/billing/billing.module';
import { AuditModule } from '@/audit/audit.module';
import { HttpModule } from '@nestjs/axios';

@Module({
  imports: [
    BullModule.registerQueue(
      { name: 'payments' },
      { name: 'reconciliation' },
    ),
    PaymentsModule,
    MnoModule,
    BillingModule,
    AuditModule,
    HttpModule,
  ],
  providers: [PaymentProcessor, ReconciliationProcessor],
})
export class JobsModule {}