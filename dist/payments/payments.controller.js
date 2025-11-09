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
exports.PaymentsController = void 0;
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const payments_service_1 = require("./payments.service");
const create_payment_dto_1 = require("./dto/create-payment.dto");
const refund_payment_dto_1 = require("./dto/refund-payment.dto");
const api_key_guard_1 = require("../common/guards/api-key.guard");
const api_consumer_entity_1 = require("../auth/entities/api-consumer.entity");
const api_key_decorator_1 = require("../common/decorators/api-key.decorator");
const payment_enum_1 = require("../common/enums/payment.enum");
let PaymentsController = class PaymentsController {
    constructor(paymentsService) {
        this.paymentsService = paymentsService;
    }
    async createPayment(createPaymentDto, consumer, idempotencyKey) {
        const payment = await this.paymentsService.createPayment(createPaymentDto, consumer, idempotencyKey);
        return {
            id: payment.id,
            amount: payment.amount,
            currency: payment.currency,
            mno: payment.mno,
            phoneNumber: payment.phoneNumber,
            status: payment.status,
            externalReference: payment.externalReference,
            expiresAt: payment.expiresAt,
            createdAt: payment.createdAt,
        };
    }
    async getPayment(id, consumer) {
        return await this.paymentsService.getPayment(id, consumer.id);
    }
    async listPayments(consumer, status, dateFrom, dateTo, limit, offset) {
        const filters = {};
        if (status)
            filters.status = status;
        if (dateFrom)
            filters.dateFrom = new Date(dateFrom);
        if (dateTo)
            filters.dateTo = new Date(dateTo);
        if (limit)
            filters.limit = Number(limit);
        if (offset)
            filters.offset = Number(offset);
        return await this.paymentsService.listPayments(consumer.id, filters);
    }
    async refundPayment(id, refundDto, consumer, idempotencyKey) {
        return await this.paymentsService.refundPayment(id, refundDto, consumer.id, idempotencyKey);
    }
};
exports.PaymentsController = PaymentsController;
__decorate([
    (0, common_1.Post)(),
    (0, swagger_1.ApiOperation)({ summary: 'Create a new payment' }),
    (0, swagger_1.ApiResponse)({ status: 201, description: 'Payment created successfully' }),
    (0, swagger_1.ApiResponse)({ status: 400, description: 'Bad request' }),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, api_key_decorator_1.ApiKey)()),
    __param(2, (0, common_1.Headers)('idempotency-key')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [create_payment_dto_1.CreatePaymentDto,
        api_consumer_entity_1.ApiConsumer, String]),
    __metadata("design:returntype", Promise)
], PaymentsController.prototype, "createPayment", null);
__decorate([
    (0, common_1.Get)(':id'),
    (0, swagger_1.ApiOperation)({ summary: 'Get payment details' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Payment details retrieved' }),
    (0, swagger_1.ApiResponse)({ status: 404, description: 'Payment not found' }),
    __param(0, (0, common_1.Param)('id', common_1.ParseUUIDPipe)),
    __param(1, (0, api_key_decorator_1.ApiKey)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, api_consumer_entity_1.ApiConsumer]),
    __metadata("design:returntype", Promise)
], PaymentsController.prototype, "getPayment", null);
__decorate([
    (0, common_1.Get)(),
    (0, swagger_1.ApiOperation)({ summary: 'List payments' }),
    (0, swagger_1.ApiQuery)({ name: 'status', enum: payment_enum_1.PaymentStatus, required: false }),
    (0, swagger_1.ApiQuery)({ name: 'dateFrom', type: 'string', required: false }),
    (0, swagger_1.ApiQuery)({ name: 'dateTo', type: 'string', required: false }),
    (0, swagger_1.ApiQuery)({ name: 'limit', type: 'number', required: false }),
    (0, swagger_1.ApiQuery)({ name: 'offset', type: 'number', required: false }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Payments retrieved successfully' }),
    __param(0, (0, api_key_decorator_1.ApiKey)()),
    __param(1, (0, common_1.Query)('status')),
    __param(2, (0, common_1.Query)('dateFrom')),
    __param(3, (0, common_1.Query)('dateTo')),
    __param(4, (0, common_1.Query)('limit')),
    __param(5, (0, common_1.Query)('offset')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [api_consumer_entity_1.ApiConsumer, String, String, String, Number, Number]),
    __metadata("design:returntype", Promise)
], PaymentsController.prototype, "listPayments", null);
__decorate([
    (0, common_1.Post)(':id/refund'),
    (0, swagger_1.ApiOperation)({ summary: 'Refund a payment' }),
    (0, swagger_1.ApiResponse)({ status: 201, description: 'Refund initiated successfully' }),
    (0, swagger_1.ApiResponse)({ status: 400, description: 'Payment cannot be refunded' }),
    (0, swagger_1.ApiResponse)({ status: 404, description: 'Payment not found' }),
    __param(0, (0, common_1.Param)('id', common_1.ParseUUIDPipe)),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, api_key_decorator_1.ApiKey)()),
    __param(3, (0, common_1.Headers)('idempotency-key')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, refund_payment_dto_1.RefundPaymentDto,
        api_consumer_entity_1.ApiConsumer, String]),
    __metadata("design:returntype", Promise)
], PaymentsController.prototype, "refundPayment", null);
exports.PaymentsController = PaymentsController = __decorate([
    (0, swagger_1.ApiTags)('Payments'),
    (0, common_1.Controller)('v1/payments'),
    (0, common_1.UseGuards)(api_key_guard_1.ApiKeyGuard),
    (0, swagger_1.ApiSecurity)('api-key'),
    __metadata("design:paramtypes", [payments_service_1.PaymentsService])
], PaymentsController);
//# sourceMappingURL=payments.controller.js.map