"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.TestUtils = void 0;
const testing_1 = require("@nestjs/testing");
const common_1 = require("@nestjs/common");
const test_module_1 = require("./test.module");
const api_consumer_entity_1 = require("../auth/entities/api-consumer.entity");
const payment_entity_1 = require("../payments/entities/payment.entity");
const transaction_entity_1 = require("../payments/entities/transaction.entity");
const usage_billing_entity_1 = require("../billing/entities/usage-billing.entity");
const typeorm_1 = require("@nestjs/typeorm");
const payment_enum_1 = require("../common/enums/payment.enum");
const uuid_1 = require("uuid");
const crypto = require("crypto");
class TestUtils {
    static async createTestingApp() {
        const moduleFixture = await testing_1.Test.createTestingModule({
            imports: [test_module_1.TestModule],
        }).compile();
        const app = moduleFixture.createNestApplication();
        app.useGlobalPipes(new common_1.ValidationPipe({
            transform: true,
            whitelist: true,
            forbidNonWhitelisted: true,
        }));
        await app.init();
        return app;
    }
    static async createTestConsumer(app, overrides = {}) {
        const consumerRepository = app.get((0, typeorm_1.getRepositoryToken)(api_consumer_entity_1.ApiConsumer));
        const defaultConsumer = {
            id: (0, uuid_1.v4)(),
            name: `Test Consumer ${Date.now()}`,
            email: `test-${Date.now()}@example.com`,
            apiKey: this.generateApiKey(),
            pricingPlan: payment_enum_1.PricingPlan.STANDARD,
            monthlyQuota: 10000,
            isActive: true,
            metadata: { test: true },
            ...overrides,
        };
        const consumer = consumerRepository.create(defaultConsumer);
        return await consumerRepository.save(consumer);
    }
    static async createTestPayment(app, consumer, overrides = {}) {
        const paymentRepository = app.get((0, typeorm_1.getRepositoryToken)(payment_entity_1.Payment));
        const defaultPayment = {
            id: (0, uuid_1.v4)(),
            consumer,
            consumerId: consumer.id,
            amount: 1000,
            currency: payment_enum_1.Currency.ZMW,
            mno: payment_enum_1.MNOProvider.MTN,
            phoneNumber: '260976123456',
            status: payment_enum_1.PaymentStatus.CREATED,
            externalReference: `test-${Date.now()}`,
            callbackUrl: 'https://example.com/callback',
            idempotencyKey: (0, uuid_1.v4)(),
            expiresAt: new Date(Date.now() + 15 * 60 * 1000),
            metadata: { test: true },
            ...overrides,
        };
        const payment = paymentRepository.create(defaultPayment);
        return await paymentRepository.save(payment);
    }
    static async createTestTransaction(app, payment, overrides = {}) {
        const transactionRepository = app.get((0, typeorm_1.getRepositoryToken)(transaction_entity_1.Transaction));
        const defaultTransaction = {
            id: (0, uuid_1.v4)(),
            payment,
            paymentId: payment.id,
            type: 'payment',
            amount: payment.amount,
            currency: payment.currency,
            status: payment.status,
            mnoReference: `mtn_${(0, uuid_1.v4)()}`,
            externalReference: payment.externalReference,
            metadata: { test: true },
            processedAt: new Date(),
            ...overrides,
        };
        const transaction = transactionRepository.create(defaultTransaction);
        return await transactionRepository.save(transaction);
    }
    static async createTestUsageBilling(app, consumer, overrides = {}) {
        const usageBillingRepository = app.get((0, typeorm_1.getRepositoryToken)(usage_billing_entity_1.UsageBilling));
        const currentMonth = new Date().toISOString().slice(0, 7);
        const defaultUsageBilling = {
            id: (0, uuid_1.v4)(),
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
    static generateApiKey() {
        const prefix = 'tk_test_';
        const randomBytes = crypto.randomBytes(16).toString('hex');
        return `${prefix}${randomBytes}`;
    }
    static async cleanupDatabase(app) {
        const repositories = [
            app.get((0, typeorm_1.getRepositoryToken)(transaction_entity_1.Transaction)),
            app.get((0, typeorm_1.getRepositoryToken)(payment_entity_1.Payment)),
            app.get((0, typeorm_1.getRepositoryToken)(usage_billing_entity_1.UsageBilling)),
            app.get((0, typeorm_1.getRepositoryToken)(api_consumer_entity_1.ApiConsumer)),
        ];
        for (const repository of repositories) {
            await repository.clear();
        }
    }
    static createMockMtnResponse(success = true) {
        if (success) {
            return {
                success: true,
                reference: `mtn_${(0, uuid_1.v4)()}`,
                transactionId: `mtn_${(0, uuid_1.v4)()}`,
                message: 'Payment initiated successfully',
            };
        }
        else {
            return {
                success: false,
                reference: `mtn_failed_${Date.now()}`,
                message: 'Payment initiation failed',
            };
        }
    }
    static createMockAirtelResponse(success = true) {
        if (success) {
            return {
                success: true,
                reference: `airtel_${(0, uuid_1.v4)()}`,
                transactionId: `airtel_${(0, uuid_1.v4)()}`,
                message: 'Payment initiated successfully',
            };
        }
        else {
            return {
                success: false,
                reference: `airtel_failed_${Date.now()}`,
                message: 'Payment initiation failed',
            };
        }
    }
    static createMockWebhookPayload(paymentId, status) {
        return {
            paymentId,
            status,
            amount: 1000,
            currency: 'ZMW',
            externalReference: `test-${Date.now()}`,
            timestamp: new Date().toISOString(),
        };
    }
    static async waitForJobCompletion(ms = 1000) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }
}
exports.TestUtils = TestUtils;
//# sourceMappingURL=test-utils.js.map