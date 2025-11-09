import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { PaymentsService } from './payments.service';
import { Payment } from './entities/payment.entity';
import { Transaction } from './entities/transaction.entity';
import { ApiConsumer } from '../auth/entities/api-consumer.entity';
import { MnoService } from '../mno/mno.service';
import { BillingService } from '../billing/billing.service';
import { AuditService } from '../audit/audit.service';
import { CreatePaymentDto } from './dto/create-payment.dto';
import { RefundPaymentDto } from './dto/refund-payment.dto';
import { PaymentStatus, MNOProvider, Currency, PricingPlan } from '../common/enums/payment.enum';
import { BadRequestException, NotFoundException } from '@nestjs/common';
import { v4 as uuidv4 } from 'uuid';

describe('PaymentsService', () => {
  let service: PaymentsService;
  let paymentRepository: Repository<Payment>;
  let transactionRepository: Repository<Transaction>;
  let mnoService: MnoService;
  let billingService: BillingService;
  let auditService: AuditService;

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
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PaymentsService,
        {
          provide: getRepositoryToken(Payment),
          useValue: mockPaymentRepository,
        },
        {
          provide: getRepositoryToken(Transaction),
          useValue: mockTransactionRepository,
        },
        {
          provide: MnoService,
          useValue: mockMnoService,
        },
        {
          provide: BillingService,
          useValue: mockBillingService,
        },
        {
          provide: AuditService,
          useValue: mockAuditService,
        },
      ],
    }).compile();

    service = module.get<PaymentsService>(PaymentsService);
    paymentRepository = module.get<Repository<Payment>>(getRepositoryToken(Payment));
    transactionRepository = module.get<Repository<Transaction>>(getRepositoryToken(Transaction));
    mnoService = module.get<MnoService>(MnoService);
    billingService = module.get<BillingService>(BillingService);
    auditService = module.get<AuditService>(AuditService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('createPayment', () => {
    const mockConsumer: ApiConsumer = {
      id: uuidv4(),
      name: 'Test Consumer',
      email: 'test@example.com',
      apiKey: 'tk_test_123',
      pricingPlan: PricingPlan.STANDARD,
      monthlyQuota: 10000,
      isActive: true,
      metadata: {},
      createdAt: new Date(),
      updatedAt: new Date(),
      payments: [],
      usageBilling: [],
    };

    const createPaymentDto: CreatePaymentDto = {
      amount: 1000,
      mno: MNOProvider.MTN,
      phoneNumber: '260976123456',
      externalReference: 'ORDER-123',
      callbackUrl: 'https://example.com/callback',
    };

    it('should create a payment successfully', async () => {
      const mockPayment = {
        id: uuidv4(),
        ...createPaymentDto,
        consumer: mockConsumer,
        consumerId: mockConsumer.id,
        status: PaymentStatus.CREATED,
        currency: Currency.ZMW,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockPaymentRepository.create.mockReturnValue(mockPayment);
      mockPaymentRepository.save.mockResolvedValue(mockPayment);
      mockBillingService.logApiUsage.mockResolvedValue(undefined);
      mockAuditService.log.mockResolvedValue(undefined);

      const result = await service.createPayment(createPaymentDto, mockConsumer);

      expect(paymentRepository.create).toHaveBeenCalledWith(
        expect.objectContaining({
          amount: createPaymentDto.amount,
          mno: createPaymentDto.mno,
          phoneNumber: createPaymentDto.phoneNumber,
          consumer: mockConsumer,
          status: PaymentStatus.CREATED,
          currency: Currency.ZMW,
        })
      );
      expect(paymentRepository.save).toHaveBeenCalledWith(mockPayment);
      expect(billingService.logApiUsage).toHaveBeenCalledWith(mockConsumer.id, 1, createPaymentDto.amount);
      expect(auditService.log).toHaveBeenCalled();
      expect(result).toEqual(mockPayment);
    });

    it('should handle idempotency correctly', async () => {
      const idempotencyKey = 'unique-key-123';
      const existingPayment = {
        id: uuidv4(),
        ...createPaymentDto,
        consumer: mockConsumer,
        status: PaymentStatus.CREATED,
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

      await expect(service.createPayment(invalidDto, mockConsumer)).rejects.toThrow(
        BadRequestException
      );
    });

    it('should validate phone number format', async () => {
      const invalidDto = { ...createPaymentDto, phoneNumber: 'invalid-phone' };

      await expect(service.createPayment(invalidDto, mockConsumer)).rejects.toThrow(
        BadRequestException
      );
    });
  });

  describe('getPayment', () => {
    it('should return payment when found', async () => {
      const paymentId = uuidv4();
      const consumerId = uuidv4();
      const mockPayment = {
        id: paymentId,
        consumerId,
        amount: 1000,
        status: PaymentStatus.CREATED,
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
      const paymentId = uuidv4();
      const consumerId = uuidv4();

      mockPaymentRepository.findOne.mockResolvedValue(null);

      await expect(service.getPayment(paymentId, consumerId)).rejects.toThrow(
        NotFoundException
      );
    });
  });

  describe('refundPayment', () => {
    const refundDto: RefundPaymentDto = {
      amount: 500,
      reason: 'Customer requested refund',
    };

    it('should process refund successfully', async () => {
      const paymentId = uuidv4();
      const consumerId = uuidv4();
      const mockPayment = {
        id: paymentId,
        consumerId,
        amount: 1000,
        status: PaymentStatus.COMPLETED,
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

      expect(mnoService.processRefund).toHaveBeenCalledWith(
        mockPayment.mnoReference,
        refundDto.amount
      );
      expect(transactionRepository.create).toHaveBeenCalled();
      expect(result).toEqual(mockRefundResponse);
    });

    it('should throw error when payment cannot be refunded', async () => {
      const paymentId = uuidv4();
      const consumerId = uuidv4();
      const mockPayment = {
        id: paymentId,
        consumerId,
        amount: 1000,
        status: PaymentStatus.FAILED,
      };

      mockPaymentRepository.findOne.mockResolvedValue(mockPayment);

      await expect(service.refundPayment(paymentId, refundDto, consumerId)).rejects.toThrow(
        BadRequestException
      );
    });

    it('should throw error when refund amount exceeds payment amount', async () => {
      const paymentId = uuidv4();
      const consumerId = uuidv4();
      const mockPayment = {
        id: paymentId,
        consumerId,
        amount: 1000,
        status: PaymentStatus.COMPLETED,
      };

      const invalidRefundDto = { ...refundDto, amount: 1500 };

      mockPaymentRepository.findOne.mockResolvedValue(mockPayment);

      await expect(service.refundPayment(paymentId, invalidRefundDto, consumerId)).rejects.toThrow(
        BadRequestException
      );
    });
  });
});
