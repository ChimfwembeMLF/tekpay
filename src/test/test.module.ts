import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { BullModule } from '@nestjs/bull';
import { AuthModule } from '../auth/auth.module';
import { PaymentsModule } from '../payments/payments.module';
import { MnoModule } from '../mno/mno.module';
import { WebhooksModule } from '../webhooks/webhooks.module';
import { AdminModule } from '../admin/admin.module';
import { BillingModule } from '../billing/billing.module';
import { JobsModule } from '../jobs/jobs.module';
import { AuditModule } from '../audit/audit.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env.test',
    }),
    TypeOrmModule.forRoot({
      type: 'postgres',
      host: process.env.DATABASE_HOST || 'localhost',
      port: parseInt(process.env.DATABASE_PORT, 10) || 5432,
      username: process.env.DATABASE_USERNAME || 'postgres',
      password: process.env.DATABASE_PASSWORD || 'postgres',
      database: process.env.DATABASE_NAME || 'tekpay_gateway_test',
      autoLoadEntities: true,
      synchronize: true, // OK for tests
      logging: false,
      dropSchema: true, // Clean database for each test run
    }),
    BullModule.forRoot({
      redis: {
        host: process.env.REDIS_HOST || 'localhost',
        port: parseInt(process.env.REDIS_PORT, 10) || 6379,
        db: 1, // Use different Redis DB for tests
      },
    }),
    AuthModule,
    PaymentsModule,
    MnoModule,
    WebhooksModule,
    AdminModule,
    BillingModule,
    JobsModule,
    AuditModule,
  ],
})
export class TestModule {}
