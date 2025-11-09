"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.PaymentsService = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const bull_1 = require("@nestjs/bull");
const payment_entity_1 = require("./entities/payment.entity");
const transaction_entity_1 = require("./entities/transaction.entity");
const payment_enum_1 = require("../common/enums/payment.enum");
const mno_service_1 = require("../mno/mno.service");
const billing_service_1 = require("../billing/billing.service");
const audit_service_1 = require("../audit/audit.service");
let PaymentsService = class PaymentsService {
    constructor(paymentRepository, transactionRepository, paymentsQueue, mnoService, billingService, auditService) {
        this.paymentRepository = paymentRepository;
        this.transactionRepository = transactionRepository;
        this.paymentsQueue = paymentsQueue;
        this.mnoService = mnoService;
        this.billingService = billingService;
        this.auditService = auditService;
    }
    async createPayment(createPaymentDto, consumer, idempotencyKey) {
        if (idempotencyKey) {
            const existingPayment = await this.paymentRepository.findOne({
                where: { idempotencyKey, consumerId: consumer.id },
            });
            if (existingPayment) {
                return existingPayment;
            }
        }
        const payment = this.paymentRepository.create({
            ...createPaymentDto,
            consumerId: consumer.id,
            idempotencyKey,
            expiresAt: new Date(Date.now() + 30 * 60 * 1000),
        });
        const savedPayment = await this.paymentRepository.save(payment);
        await this.billingService.logApiUsage(consumer.id, 1, createPaymentDto.amount);
        await this.auditService.log({
            action: 'payment.created',
            resourceId: savedPayment.id,
            resourceType: 'payment',
            userId: consumer.id,
            metadata: { amount: createPaymentDto.amount, mno: createPaymentDto.mno },
        });
        await this.paymentsQueue.add('initiate-payment', { paymentId: savedPayment.id });
        return savedPayment;
    }
    async initiatePayment(paymentId) {
        const payment = await this.paymentRepository.findOne({
            where: { id: paymentId },
        });
        if (!payment) {
            throw new common_1.NotFoundException('Payment not found');
        }
        if (payment.status !== payment_enum_1.PaymentStatus.CREATED) {
            return;
        }
        try {
            payment.status = payment_enum_1.PaymentStatus.INITIATED;
            await this.paymentRepository.save(payment);
            const result = await this.mnoService.initiatePayment({
                amount: payment.amount,
                phoneNumber: payment.phoneNumber,
                mno: payment.mno,
                reference: payment.id,
            });
            payment.mnoReference = result.reference;
            payment.status = payment_enum_1.PaymentStatus.PENDING;
            await this.paymentRepository.save(payment);
            await this.transactionRepository.save({
                paymentId: payment.id,
                type: payment_enum_1.TransactionType.PAYMENT,
                amount: payment.amount,
                currency: payment.currency,
                status: 'pending',
                mnoTransactionId: result.reference,
                rawPayload: result,
            });
            await this.auditService.log({
                action: 'payment.initiated',
                resourceId: payment.id,
                resourceType: 'payment',
                metadata: { mnoReference: result.reference },
            });
        }
        catch (error) {
            payment.status = payment_enum_1.PaymentStatus.FAILED;
            await this.paymentRepository.save(payment);
            await this.auditService.log({
                action: 'payment.failed',
                resourceId: payment.id,
                resourceType: 'payment',
                metadata: { error: error.message },
            });
            throw error;
        }
    }
    async getPayment(id, consumerId) {
        const where = { id };
        if (consumerId) {
            where.consumerId = consumerId;
        }
        const payment = await this.paymentRepository.findOne({
            where,
            relations: ['transactions', 'consumer'],
        });
        if (!payment) {
            throw new common_1.NotFoundException('Payment not found');
        }
        return payment;
    }
    async listPayments(consumerId, filters = {}) {
        const { status, dateFrom, dateTo, limit = 50, offset = 0 } = filters;
        const where = { consumerId };
        if (status) {
            where.status = status;
        }
        if (dateFrom && dateTo) {
            where.createdAt = (0, typeorm_2.Between)(dateFrom, dateTo);
        }
        const [payments, total] = await this.paymentRepository.findAndCount({
            where,
            relations: ['transactions'],
            order: { createdAt: 'DESC' },
            take: limit,
            skip: offset,
        });
        return { payments, total };
    }
    async refundPayment(paymentId, refundDto, consumerId, idempotencyKey) {
        const payment = await this.getPayment(paymentId, consumerId);
        if (payment.status !== payment_enum_1.PaymentStatus.COMPLETED && payment.status !== payment_enum_1.PaymentStatus.SETTLED) {
            throw new common_1.BadRequestException('Payment cannot be refunded');
        }
        const refundAmount = refundDto.amount || payment.amount;
        if (refundAmount > payment.amount) {
            throw new common_1.BadRequestException('Refund amount cannot exceed payment amount');
        }
        if (idempotencyKey) {
            const existingRefund = await this.transactionRepository.findOne({
                where: {
                    paymentId: payment.id,
                    type: payment_enum_1.TransactionType.REFUND,
                    rawPayload: { idempotencyKey },
                },
            });
            if (existingRefund) {
                return existingRefund;
            }
        }
        const refundTransaction = this.transactionRepository.create({
            paymentId: payment.id,
            type: payment_enum_1.TransactionType.REFUND,
            amount: refundAmount,
            currency: payment.currency,
            status: 'pending',
            rawPayload: { reason: refundDto.reason, idempotencyKey },
        });
        const savedRefund = await this.transactionRepository.save(refundTransaction);
        await this.paymentsQueue.add('process-refund', {
            refundId: savedRefund.id,
            paymentId: payment.id,
        });
        await this.auditService.log({
            action: 'payment.refund_requested',
            resourceId: payment.id,
            resourceType: 'payment',
            userId: consumerId,
            metadata: { amount: refundAmount, reason: refundDto.reason },
        });
        return savedRefund;
    }
    async updatePaymentStatus(paymentId, status, mnoTransactionId, metadata) {
        const payment = await this.paymentRepository.findOne({
            where: { id: paymentId },
        });
        if (!payment) {
            throw new common_1.NotFoundException('Payment not found');
        }
        const oldStatus = payment.status;
        payment.status = status;
        if (mnoTransactionId) {
            payment.mnoReference = mnoTransactionId;
        }
        await this.paymentRepository.save(payment);
        await this.transactionRepository.save({
            paymentId: payment.id,
            type: payment_enum_1.TransactionType.PAYMENT,
            amount: 0,
            currency: payment.currency,
            status: status.toLowerCase(),
            mnoTransactionId,
            rawPayload: metadata,
            processedAt: new Date(),
        });
        await this.auditService.log({
            action: 'payment.status_updated',
            resourceId: payment.id,
            resourceType: 'payment',
            metadata: { oldStatus, newStatus: status, mnoTransactionId },
        });
        if (payment.callbackUrl && (status === payment_enum_1.PaymentStatus.COMPLETED || status === payment_enum_1.PaymentStatus.FAILED)) {
            await this.paymentsQueue.add('send-callback', {
                paymentId: payment.id,
                callbackUrl: payment.callbackUrl,
                status,
            });
        }
    }
};
exports.PaymentsService = PaymentsService;
exports.PaymentsService = PaymentsService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(payment_entity_1.Payment)),
    __param(1, (0, typeorm_1.InjectRepository)(transaction_entity_1.Transaction)),
    __param(2, (0, bull_1.InjectQueue)('payments')),
    __metadata("design:paramtypes", [typeorm_2.Repository,
        typeorm_2.Repository, Object, mno_service_1.MnoService,
        billing_service_1.BillingService,
        audit_service_1.AuditService])
], PaymentsService);
//# sourceMappingURL=payments.service.js.map