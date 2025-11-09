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
var WebhooksService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.WebhooksService = void 0;
const common_1 = require("@nestjs/common");
const payments_service_1 = require("../payments/payments.service");
const audit_service_1 = require("../audit/audit.service");
const payment_enum_1 = require("../common/enums/payment.enum");
const crypto = require("crypto");
let WebhooksService = WebhooksService_1 = class WebhooksService {
    constructor(paymentsService, auditService) {
        this.paymentsService = paymentsService;
        this.auditService = auditService;
        this.logger = new common_1.Logger(WebhooksService_1.name);
    }
    async handleMtnWebhook(payload, signature) {
        try {
            if (!this.verifyWebhookSignature(JSON.stringify(payload), signature, 'mtn')) {
                throw new common_1.BadRequestException('Invalid webhook signature');
            }
            const { transactionId, status, reference } = payload;
            this.logger.log(`Processing MTN webhook: ${transactionId}, status: ${status}`);
            const paymentStatus = this.mapMtnStatus(status);
            if (paymentStatus) {
                await this.paymentsService.updatePaymentStatus(reference, paymentStatus, transactionId, payload);
            }
            await this.auditService.log({
                action: 'webhook.mtn_received',
                resourceType: 'webhook',
                metadata: { payload, status: paymentStatus },
            });
        }
        catch (error) {
            this.logger.error(`MTN webhook processing failed: ${error.message}`);
            await this.auditService.log({
                action: 'webhook.mtn_failed',
                resourceType: 'webhook',
                metadata: { error: error.message, payload },
            });
            throw error;
        }
    }
    async handleAirtelWebhook(payload, signature) {
        try {
            if (!this.verifyWebhookSignature(JSON.stringify(payload), signature, 'airtel')) {
                throw new common_1.BadRequestException('Invalid webhook signature');
            }
            const { transactionId, status, reference } = payload;
            this.logger.log(`Processing Airtel webhook: ${transactionId}, status: ${status}`);
            const paymentStatus = this.mapAirtelStatus(status);
            if (paymentStatus) {
                await this.paymentsService.updatePaymentStatus(reference, paymentStatus, transactionId, payload);
            }
            await this.auditService.log({
                action: 'webhook.airtel_received',
                resourceType: 'webhook',
                metadata: { payload, status: paymentStatus },
            });
        }
        catch (error) {
            this.logger.error(`Airtel webhook processing failed: ${error.message}`);
            await this.auditService.log({
                action: 'webhook.airtel_failed',
                resourceType: 'webhook',
                metadata: { error: error.message, payload },
            });
            throw error;
        }
    }
    verifyWebhookSignature(payload, signature, provider) {
        if (!signature) {
            return false;
        }
        try {
            const secret = process.env.WEBHOOK_SECRET;
            const expectedSignature = crypto
                .createHmac('sha256', secret)
                .update(payload)
                .digest('hex');
            return crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(`sha256=${expectedSignature}`));
        }
        catch (error) {
            this.logger.error(`Signature verification failed: ${error.message}`);
            return false;
        }
    }
    mapMtnStatus(status) {
        const statusMap = {
            'SUCCESSFUL': payment_enum_1.PaymentStatus.COMPLETED,
            'FAILED': payment_enum_1.PaymentStatus.FAILED,
            'PENDING': payment_enum_1.PaymentStatus.PENDING,
            'CANCELLED': payment_enum_1.PaymentStatus.FAILED,
            'EXPIRED': payment_enum_1.PaymentStatus.EXPIRED,
        };
        return statusMap[status] || null;
    }
    mapAirtelStatus(status) {
        const statusMap = {
            'SUCCESS': payment_enum_1.PaymentStatus.COMPLETED,
            'FAILED': payment_enum_1.PaymentStatus.FAILED,
            'PENDING': payment_enum_1.PaymentStatus.PENDING,
            'CANCELLED': payment_enum_1.PaymentStatus.FAILED,
            'EXPIRED': payment_enum_1.PaymentStatus.EXPIRED,
        };
        return statusMap[status] || null;
    }
};
exports.WebhooksService = WebhooksService;
exports.WebhooksService = WebhooksService = WebhooksService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [payments_service_1.PaymentsService,
        audit_service_1.AuditService])
], WebhooksService);
//# sourceMappingURL=webhooks.service.js.map