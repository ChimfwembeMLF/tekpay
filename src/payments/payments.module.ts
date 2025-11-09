import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { BullModule } from '@nestjs/bull';
import { PaymentsController } from './payments.controller';
import { PaymentsService } from './payments.service';
import { Payment } from './entities/payment.entity';
import { Transaction } from './entities/transaction.entity';
import { AuthModule } from '@/auth/auth.module';
import { MnoModule } from '@/mno/mno.module';
import { BillingModule } from '@/billing/billing.module';
import { AuditModule } from '@/audit/audit.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Payment, Transaction]),
    BullModule.registerQueue({
      name: 'payments',
    }),
    AuthModule,
    MnoModule,
    BillingModule,
    AuditModule,
  ],
  controllers: [PaymentsController],
  providers: [PaymentsService],
  exports: [PaymentsService, TypeOrmModule],
})
export class PaymentsModule {}