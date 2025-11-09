import { Module } from '@nestjs/common';
import { AdminController } from './admin.controller';
import { AdminService } from './admin.service';
import { PaymentsModule } from '@/payments/payments.module';
import { AuthModule } from '@/auth/auth.module';
import { BillingModule } from '@/billing/billing.module';
import { AuditModule } from '@/audit/audit.module';

@Module({
  imports: [PaymentsModule, AuthModule, BillingModule, AuditModule],
  controllers: [AdminController],
  providers: [AdminService],
})
export class AdminModule {}