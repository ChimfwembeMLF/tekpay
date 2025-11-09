import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import { ValidationPipe } from '@nestjs/common';
import * as request from 'supertest';
import { TestUtils } from '../test/test-utils';
import { PaymentsController } from './payments.controller';
import { PaymentsService } from './payments.service';
import { CreatePaymentDto } from './dto/create-payment.dto';
import { RefundPaymentDto } from './dto/refund-payment.dto';
import { MNOProvider, PaymentStatus } from '../common/enums/payment.enum';
import { ApiConsumer } from '../auth/entities/api-consumer.entity';
import { Payment } from './entities/payment.entity';

describe('PaymentsController (Integration)', () => {
  let app: INestApplication;
  let testConsumer: ApiConsumer;

  beforeAll(async () => {
    app = await TestUtils.createTestingApp();
  });

  beforeEach(async () => {
    await TestUtils.cleanupDatabase(app);
    testConsumer = await TestUtils.createTestConsumer(app);
  });

  afterAll(async () => {
    await app.close();
  });

  describe('POST /api/v1/payments', () => {
    const createPaymentDto: CreatePaymentDto = {
      amount: 1000,
      mno: MNOProvider.MTN,
      phoneNumber: '260976123456',
      externalReference: 'ORDER-123',
      callbackUrl: 'https://example.com/callback',
    };

    it('should create a payment successfully', async () => {
      const response = await request(app.getHttpServer())
        .post('/api/v1/payments')
        .set('X-API-Key', testConsumer.apiKey)
        .send(createPaymentDto)
        .expect(201);

      expect(response.body).toMatchObject({
        amount: createPaymentDto.amount,
        mno: createPaymentDto.mno,
        phoneNumber: createPaymentDto.phoneNumber,
        status: PaymentStatus.CREATED,
        externalReference: createPaymentDto.externalReference,
      });

      expect(response.body.id).toBeDefined();
      expect(response.body.createdAt).toBeDefined();
      expect(response.body.expiresAt).toBeDefined();
    });

    it('should handle idempotency correctly', async () => {
      const idempotencyKey = 'unique-key-123';

      // First request
      const response1 = await request(app.getHttpServer())
        .post('/api/v1/payments')
        .set('X-API-Key', testConsumer.apiKey)
        .set('Idempotency-Key', idempotencyKey)
        .send(createPaymentDto)
        .expect(201);

      // Second request with same idempotency key
      const response2 = await request(app.getHttpServer())
        .post('/api/v1/payments')
        .set('X-API-Key', testConsumer.apiKey)
        .set('Idempotency-Key', idempotencyKey)
        .send(createPaymentDto)
        .expect(201);

      expect(response1.body.id).toBe(response2.body.id);
    });

    it('should reject invalid payment data', async () => {
      const invalidDto = {
        ...createPaymentDto,
        amount: -100, // Invalid amount
      };

      await request(app.getHttpServer())
        .post('/api/v1/payments')
        .set('X-API-Key', testConsumer.apiKey)
        .send(invalidDto)
        .expect(400);
    });

    it('should reject request without API key', async () => {
      await request(app.getHttpServer())
        .post('/api/v1/payments')
        .send(createPaymentDto)
        .expect(401);
    });

    it('should reject request with invalid API key', async () => {
      await request(app.getHttpServer())
        .post('/api/v1/payments')
        .set('X-API-Key', 'invalid-key')
        .send(createPaymentDto)
        .expect(401);
    });

    it('should validate phone number format', async () => {
      const invalidDto = {
        ...createPaymentDto,
        phoneNumber: 'invalid-phone',
      };

      await request(app.getHttpServer())
        .post('/api/v1/payments')
        .set('X-API-Key', testConsumer.apiKey)
        .send(invalidDto)
        .expect(400);
    });

    it('should validate callback URL format', async () => {
      const invalidDto = {
        ...createPaymentDto,
        callbackUrl: 'not-a-url',
      };

      await request(app.getHttpServer())
        .post('/api/v1/payments')
        .set('X-API-Key', testConsumer.apiKey)
        .send(invalidDto)
        .expect(400);
    });
  });

  describe('GET /api/v1/payments/:id', () => {
    let testPayment: Payment;

    beforeEach(async () => {
      testPayment = await TestUtils.createTestPayment(app, testConsumer);
    });

    it('should return payment details', async () => {
      const response = await request(app.getHttpServer())
        .get(`/api/v1/payments/${testPayment.id}`)
        .set('X-API-Key', testConsumer.apiKey)
        .expect(200);

      expect(response.body).toMatchObject({
        id: testPayment.id,
        amount: testPayment.amount,
        mno: testPayment.mno,
        phoneNumber: testPayment.phoneNumber,
        status: testPayment.status,
      });
    });

    it('should return 404 for non-existent payment', async () => {
      const nonExistentId = '123e4567-e89b-12d3-a456-426614174000';

      await request(app.getHttpServer())
        .get(`/api/v1/payments/${nonExistentId}`)
        .set('X-API-Key', testConsumer.apiKey)
        .expect(404);
    });

    it('should not return payment from different consumer', async () => {
      const otherConsumer = await TestUtils.createTestConsumer(app, {
        email: 'other@example.com',
        name: 'Other Consumer',
      });

      await request(app.getHttpServer())
        .get(`/api/v1/payments/${testPayment.id}`)
        .set('X-API-Key', otherConsumer.apiKey)
        .expect(404);
    });

    it('should validate UUID format', async () => {
      await request(app.getHttpServer())
        .get('/api/v1/payments/invalid-uuid')
        .set('X-API-Key', testConsumer.apiKey)
        .expect(400);
    });
  });

  describe('GET /api/v1/payments', () => {
    beforeEach(async () => {
      // Create multiple test payments
      await TestUtils.createTestPayment(app, testConsumer, {
        status: PaymentStatus.COMPLETED,
        mno: MNOProvider.MTN,
      });
      await TestUtils.createTestPayment(app, testConsumer, {
        status: PaymentStatus.PENDING,
        mno: MNOProvider.AIRTEL,
      });
      await TestUtils.createTestPayment(app, testConsumer, {
        status: PaymentStatus.FAILED,
        mno: MNOProvider.MTN,
      });
    });

    it('should return list of payments', async () => {
      const response = await request(app.getHttpServer())
        .get('/api/v1/payments')
        .set('X-API-Key', testConsumer.apiKey)
        .expect(200);

      expect(response.body).toHaveProperty('payments');
      expect(response.body.payments).toHaveLength(3);
      expect(response.body).toHaveProperty('total', 3);
    });

    it('should filter by status', async () => {
      const response = await request(app.getHttpServer())
        .get('/api/v1/payments?status=completed')
        .set('X-API-Key', testConsumer.apiKey)
        .expect(200);

      expect(response.body.payments).toHaveLength(1);
      expect(response.body.payments[0].status).toBe(PaymentStatus.COMPLETED);
    });

    it('should filter by MNO', async () => {
      const response = await request(app.getHttpServer())
        .get('/api/v1/payments?mno=MTN')
        .set('X-API-Key', testConsumer.apiKey)
        .expect(200);

      expect(response.body.payments).toHaveLength(2);
      response.body.payments.forEach((payment: any) => {
        expect(payment.mno).toBe(MNOProvider.MTN);
      });
    });

    it('should support pagination', async () => {
      const response = await request(app.getHttpServer())
        .get('/api/v1/payments?limit=2&offset=1')
        .set('X-API-Key', testConsumer.apiKey)
        .expect(200);

      expect(response.body.payments).toHaveLength(2);
    });
  });

  describe('POST /api/v1/payments/:id/refund', () => {
    let testPayment: Payment;

    beforeEach(async () => {
      testPayment = await TestUtils.createTestPayment(app, testConsumer, {
        status: PaymentStatus.COMPLETED,
        mnoReference: 'mtn_123456',
      });
    });

    const refundDto: RefundPaymentDto = {
      amount: 500,
      reason: 'Customer requested refund',
    };

    it('should process refund successfully', async () => {
      const response = await request(app.getHttpServer())
        .post(`/api/v1/payments/${testPayment.id}/refund`)
        .set('X-API-Key', testConsumer.apiKey)
        .send(refundDto)
        .expect(201);

      expect(response.body).toMatchObject({
        success: true,
        amount: refundDto.amount,
        status: 'processing',
      });

      expect(response.body.refundId).toBeDefined();
    });

    it('should reject refund for non-completed payment', async () => {
      const pendingPayment = await TestUtils.createTestPayment(app, testConsumer, {
        status: PaymentStatus.PENDING,
      });

      await request(app.getHttpServer())
        .post(`/api/v1/payments/${pendingPayment.id}/refund`)
        .set('X-API-Key', testConsumer.apiKey)
        .send(refundDto)
        .expect(400);
    });

    it('should reject refund amount greater than payment amount', async () => {
      const invalidRefundDto = {
        ...refundDto,
        amount: testPayment.amount + 100,
      };

      await request(app.getHttpServer())
        .post(`/api/v1/payments/${testPayment.id}/refund`)
        .set('X-API-Key', testConsumer.apiKey)
        .send(invalidRefundDto)
        .expect(400);
    });

    it('should handle idempotency for refunds', async () => {
      const idempotencyKey = 'refund-key-123';

      // First refund request
      const response1 = await request(app.getHttpServer())
        .post(`/api/v1/payments/${testPayment.id}/refund`)
        .set('X-API-Key', testConsumer.apiKey)
        .set('Idempotency-Key', idempotencyKey)
        .send(refundDto)
        .expect(201);

      // Second refund request with same idempotency key
      const response2 = await request(app.getHttpServer())
        .post(`/api/v1/payments/${testPayment.id}/refund`)
        .set('X-API-Key', testConsumer.apiKey)
        .set('Idempotency-Key', idempotencyKey)
        .send(refundDto)
        .expect(201);

      expect(response1.body.refundId).toBe(response2.body.refundId);
    });
  });
});
