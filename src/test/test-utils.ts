import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import { ValidationPipe } from '@nestjs/common';
import { TestModule } from './test.module';
import { ApiConsumer } from '../auth/entities/api-consumer.entity';
import { Payment } from '../payments/entities/payment.entity';
import { Transaction } from '../payments/entities/transaction.entity';
import { UsageBilling } from '../billing/entities/usage-billing.entity';
import { Repository } from 'typeorm';
import { getRepositoryToken } from '@nestjs/typeorm';
import { PricingPlan, MNOProvider, PaymentStatus, Currency } from '../common/enums/payment.enum';
import { v4 as uuidv4 } from 'uuid';
import * as crypto from 'crypto';

export class TestUtils {
  static async createTestingApp(): Promise<INestApplication> {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [TestModule],
    }).compile();

    const app = moduleFixture.createNestApplication();
    
    // Apply the same validation pipe as in main.ts
    app.useGlobalPipes(new ValidationPipe({
      transform: true,
      whitelist: true,
      forbidNonWhitelisted: true,
    }));

    await app.init();
    return app;
  }

  static async createTestConsumer(
    app: INestApplication,
    overrides: Partial<ApiConsumer> = {}
  ): Promise<ApiConsumer> {
    const consumerRepository = app.get<Repository<ApiConsumer>>(
      getRepositoryToken(ApiConsumer)
    );

    const defaultConsumer = {
      id: uuidv4(),
      name: `Test Consumer ${Date.now()}`,
      email: `test-${Date.now()}@example.com`,
      apiKey: this.generateApiKey(),
      pricingPlan: PricingPlan.STANDARD,
      monthlyQuota: 10000,
      isActive: true,
      metadata: { test: true },
      ...overrides,
    };

    const consumer = consumerRepository.create(defaultConsumer);
    return await consumerRepository.save(consumer);
  }

  static async createTestPayment(
    app: INestApplication,
    consumer: ApiConsumer,
    overrides: Partial<Payment> = {}
  ): Promise<Payment> {
    const paymentRepository = app.get<Repository<Payment>>(
      getRepositoryToken(Payment)
    );

    const defaultPayment = {
      id: uuidv4(),
      consumer,
      consumerId: consumer.id,
      amount: 1000,
      currency: Currency.ZMW,
      mno: MNOProvider.MTN,
      phoneNumber: '260976123456',
      status: PaymentStatus.CREATED,
      externalReference: `test-${Date.now()}`,
      callbackUrl: 'https://example.com/callback',
      idempotencyKey: uuidv4(),
      expiresAt: new Date(Date.now() + 15 * 60 * 1000), // 15 minutes
      metadata: { test: true },
      ...overrides,
    };

    const payment = paymentRepository.create(defaultPayment);
    return await paymentRepository.save(payment);
  }

  static async createTestTransaction(
    app: INestApplication,
    payment: Payment,
    overrides: Partial<Transaction> = {}
  ): Promise<Transaction> {
    const transactionRepository = app.get<Repository<Transaction>>(
      getRepositoryToken(Transaction)
    );

    const defaultTransaction = {
      id: uuidv4(),
      payment,
      paymentId: payment.id,
      type: 'payment' as any,
      amount: payment.amount,
      currency: payment.currency,
      status: payment.status,
      mnoReference: `mtn_${uuidv4()}`,
      externalReference: payment.externalReference,
      metadata: { test: true },
      processedAt: new Date(),
      ...overrides,
    };

    const transaction = transactionRepository.create(defaultTransaction);
    return await transactionRepository.save(transaction);
  }

  static async createTestUsageBilling(
    app: INestApplication,
    consumer: ApiConsumer,
    overrides: Partial<UsageBilling> = {}
  ): Promise<UsageBilling> {
    const usageBillingRepository = app.get<Repository<UsageBilling>>(
      getRepositoryToken(UsageBilling)
    );

    const currentMonth = new Date().toISOString().slice(0, 7); // YYYY-MM format

    const defaultUsageBilling = {
      id: uuidv4(),
      consumer,
      consumerId: consumer.id,
      apiCalls: 100,
      totalVolume: 10000,
      billingPeriod: currentMonth,
      charges: 100,
      lastUpdated: new Date(),
      ...overrides,
    };

    const usageBilling = usageBillingRepository.create(defaultUsageBilling);
    return await usageBillingRepository.save(usageBilling);
  }

  static generateApiKey(): string {
    const prefix = 'tk_test_';
    const randomBytes = crypto.randomBytes(16).toString('hex');
    return `${prefix}${randomBytes}`;
  }

  static async cleanupDatabase(app: INestApplication): Promise<void> {
    const repositories = [
      app.get<Repository<Transaction>>(getRepositoryToken(Transaction)),
      app.get<Repository<Payment>>(getRepositoryToken(Payment)),
      app.get<Repository<UsageBilling>>(getRepositoryToken(UsageBilling)),
      app.get<Repository<ApiConsumer>>(getRepositoryToken(ApiConsumer)),
    ];

    for (const repository of repositories) {
      await repository.clear();
    }
  }

  static createMockMtnResponse(success: boolean = true) {
    if (success) {
      return {
        success: true,
        reference: `mtn_${uuidv4()}`,
        transactionId: `mtn_${uuidv4()}`,
        message: 'Payment initiated successfully',
      };
    } else {
      return {
        success: false,
        reference: `mtn_failed_${Date.now()}`,
        message: 'Payment initiation failed',
      };
    }
  }

  static createMockAirtelResponse(success: boolean = true) {
    if (success) {
      return {
        success: true,
        reference: `airtel_${uuidv4()}`,
        transactionId: `airtel_${uuidv4()}`,
        message: 'Payment initiated successfully',
      };
    } else {
      return {
        success: false,
        reference: `airtel_failed_${Date.now()}`,
        message: 'Payment initiation failed',
      };
    }
  }

  static createMockWebhookPayload(paymentId: string, status: PaymentStatus) {
    return {
      paymentId,
      status,
      amount: 1000,
      currency: 'ZMW',
      externalReference: `test-${Date.now()}`,
      timestamp: new Date().toISOString(),
    };
  }

  static async waitForJobCompletion(ms: number = 1000): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}
