"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const testing_1 = require("@nestjs/testing");
const typeorm_1 = require("@nestjs/typeorm");
const payments_service_1 = require("./payments.service");
const payment_entity_1 = require("./entities/payment.entity");
const transaction_entity_1 = require("./entities/transaction.entity");
const mno_service_1 = require("../mno/mno.service");
const billing_service_1 = require("../billing/billing.service");
const audit_service_1 = require("../audit/audit.service");
const payment_enum_1 = require("../common/enums/payment.enum");
const common_1 = require("@nestjs/common");
const uuid_1 = require("uuid");
describe('PaymentsService', () => {
    let service;
    let paymentRepository;
    let transactionRepository;
    let mnoService;
    let billingService;
    let auditService;
    const mockPaymentRepository = {
        create: jest.fn(),
        save: jest.fn(),
        findOne: jest.fn(),
        find: jest.fn(),
        createQueryBuilder: jest.fn(),
    };
    const mockTransactionRepository = {
        create: jest.fn(),
        save: jest.fn(),
        findOne: jest.fn(),
    };
    const mockMnoService = {
        initiatePayment: jest.fn(),
        processRefund: jest.fn(),
    };
    const mockBillingService = {
        logApiUsage: jest.fn(),
        getUsage: jest.fn(),
        calculateCharges: jest.fn(),
        updateCharges: jest.fn(),
    };
    const mockAuditService = {
        log: jest.fn(),
    };
    beforeEach(async () => {
        const module = await testing_1.Test.createTestingModule({
            providers: [
                payments_service_1.PaymentsService,
                {
                    provide: (0, typeorm_1.getRepositoryToken)(payment_entity_1.Payment),
                    useValue: mockPaymentRepository,
                },
                {
                    provide: (0, typeorm_1.getRepositoryToken)(transaction_entity_1.Transaction),
                    useValue: mockTransactionRepository,
                },
                {
                    provide: mno_service_1.MnoService,
                    useValue: mockMnoService,
                },
                {
                    provide: billing_service_1.BillingService,
                    useValue: mockBillingService,
                },
                {
                    provide: audit_service_1.AuditService,
                    useValue: mockAuditService,
                },
            ],
        }).compile();
        service = module.get(payments_service_1.PaymentsService);
        paymentRepository = module.get((0, typeorm_1.getRepositoryToken)(payment_entity_1.Payment));
        transactionRepository = module.get((0, typeorm_1.getRepositoryToken)(transaction_entity_1.Transaction));
        mnoService = module.get(mno_service_1.MnoService);
        billingService = module.get(billing_service_1.BillingService);
        auditService = module.get(audit_service_1.AuditService);
    });
    afterEach(() => {
        jest.clearAllMocks();
    });
    describe('createPayment', () => {
        const mockConsumer = {
            id: (0, uuid_1.v4)(),
            name: 'Test Consumer',
            email: 'test@example.com',
            apiKey: 'tk_test_123',
            pricingPlan: payment_enum_1.PricingPlan.STANDARD,
            monthlyQuota: 10000,
            isActive: true,
            metadata: {},
            createdAt: new Date(),
            updatedAt: new Date(),
            payments: [],
            usageBilling: [],
        };
        const createPaymentDto = {
            amount: 1000,
            mno: payment_enum_1.MNOProvider.MTN,
            phoneNumber: '260976123456',
            externalReference: 'ORDER-123',
            callbackUrl: 'https://example.com/callback',
        };
        it('should create a payment successfully', async () => {
            const mockPayment = {
                id: (0, uuid_1.v4)(),
                ...createPaymentDto,
                consumer: mockConsumer,
                consumerId: mockConsumer.id,
                status: payment_enum_1.PaymentStatus.CREATED,
                currency: payment_enum_1.Currency.ZMW,
                createdAt: new Date(),
                updatedAt: new Date(),
            };
            mockPaymentRepository.create.mockReturnValue(mockPayment);
            mockPaymentRepository.save.mockResolvedValue(mockPayment);
            mockBillingService.logApiUsage.mockResolvedValue(undefined);
            mockAuditService.log.mockResolvedValue(undefined);
            const result = await service.createPayment(createPaymentDto, mockConsumer);
            expect(paymentRepository.create).toHaveBeenCalledWith(expect.objectContaining({
                amount: createPaymentDto.amount,
                mno: createPaymentDto.mno,
                phoneNumber: createPaymentDto.phoneNumber,
                consumer: mockConsumer,
                status: payment_enum_1.PaymentStatus.CREATED,
                currency: payment_enum_1.Currency.ZMW,
            }));
            expect(paymentRepository.save).toHaveBeenCalledWith(mockPayment);
            expect(billingService.logApiUsage).toHaveBeenCalledWith(mockConsumer.id, 1, createPaymentDto.amount);
            expect(auditService.log).toHaveBeenCalled();
            expect(result).toEqual(mockPayment);
        });
        it('should handle idempotency correctly', async () => {
            const idempotencyKey = 'unique-key-123';
            const existingPayment = {
                id: (0, uuid_1.v4)(),
                ...createPaymentDto,
                consumer: mockConsumer,
                status: payment_enum_1.PaymentStatus.CREATED,
                idempotencyKey,
            };
            mockPaymentRepository.findOne.mockResolvedValue(existingPayment);
            const result = await service.createPayment(createPaymentDto, mockConsumer, idempotencyKey);
            expect(paymentRepository.findOne).toHaveBeenCalledWith({
                where: { idempotencyKey, consumerId: mockConsumer.id },
            });
            expect(paymentRepository.create).not.toHaveBeenCalled();
            expect(result).toEqual(existingPayment);
        });
        it('should validate payment amount', async () => {
            const invalidDto = { ...createPaymentDto, amount: 0 };
            await expect(service.createPayment(invalidDto, mockConsumer)).rejects.toThrow(common_1.BadRequestException);
        });
        it('should validate phone number format', async () => {
            const invalidDto = { ...createPaymentDto, phoneNumber: 'invalid-phone' };
            await expect(service.createPayment(invalidDto, mockConsumer)).rejects.toThrow(common_1.BadRequestException);
        });
    });
    describe('getPayment', () => {
        it('should return payment when found', async () => {
            const paymentId = (0, uuid_1.v4)();
            const consumerId = (0, uuid_1.v4)();
            const mockPayment = {
                id: paymentId,
                consumerId,
                amount: 1000,
                status: payment_enum_1.PaymentStatus.CREATED,
            };
            mockPaymentRepository.findOne.mockResolvedValue(mockPayment);
            const result = await service.getPayment(paymentId, consumerId);
            expect(paymentRepository.findOne).toHaveBeenCalledWith({
                where: { id: paymentId, consumerId },
                relations: ['transactions'],
            });
            expect(result).toEqual(mockPayment);
        });
        it('should throw NotFoundException when payment not found', async () => {
            const paymentId = (0, uuid_1.v4)();
            const consumerId = (0, uuid_1.v4)();
            mockPaymentRepository.findOne.mockResolvedValue(null);
            await expect(service.getPayment(paymentId, consumerId)).rejects.toThrow(common_1.NotFoundException);
        });
    });
    describe('refundPayment', () => {
        const refundDto = {
            amount: 500,
            reason: 'Customer requested refund',
        };
        it('should process refund successfully', async () => {
            const paymentId = (0, uuid_1.v4)();
            const consumerId = (0, uuid_1.v4)();
            const mockPayment = {
                id: paymentId,
                consumerId,
                amount: 1000,
                status: payment_enum_1.PaymentStatus.COMPLETED,
                mnoReference: 'mtn_123',
            };
            const mockRefundResponse = {
                success: true,
                refundId: 'refund_123',
                amount: refundDto.amount,
                status: 'processing',
            };
            mockPaymentRepository.findOne.mockResolvedValue(mockPayment);
            mockMnoService.processRefund.mockResolvedValue(mockRefundResponse);
            mockTransactionRepository.create.mockReturnValue({});
            mockTransactionRepository.save.mockResolvedValue({});
            const result = await service.refundPayment(paymentId, refundDto, consumerId);
            expect(mnoService.processRefund).toHaveBeenCalledWith(mockPayment.mnoReference, refundDto.amount);
            expect(transactionRepository.create).toHaveBeenCalled();
            expect(result).toEqual(mockRefundResponse);
        });
        it('should throw error when payment cannot be refunded', async () => {
            const paymentId = (0, uuid_1.v4)();
            const consumerId = (0, uuid_1.v4)();
            const mockPayment = {
                id: paymentId,
                consumerId,
                amount: 1000,
                status: payment_enum_1.PaymentStatus.FAILED,
            };
            mockPaymentRepository.findOne.mockResolvedValue(mockPayment);
            await expect(service.refundPayment(paymentId, refundDto, consumerId)).rejects.toThrow(common_1.BadRequestException);
        });
        it('should throw error when refund amount exceeds payment amount', async () => {
            const paymentId = (0, uuid_1.v4)();
            const consumerId = (0, uuid_1.v4)();
            const mockPayment = {
                id: paymentId,
                consumerId,
                amount: 1000,
                status: payment_enum_1.PaymentStatus.COMPLETED,
            };
            const invalidRefundDto = { ...refundDto, amount: 1500 };
            mockPaymentRepository.findOne.mockResolvedValue(mockPayment);
            await expect(service.refundPayment(paymentId, invalidRefundDto, consumerId)).rejects.toThrow(common_1.BadRequestException);
        });
    });
});
//# sourceMappingURL=payments.service.spec.js.map