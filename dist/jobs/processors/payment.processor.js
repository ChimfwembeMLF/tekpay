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
var PaymentProcessor_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.PaymentProcessor = void 0;
const bull_1 = require("@nestjs/bull");
const common_1 = require("@nestjs/common");
const payments_service_1 = require("../../payments/payments.service");
const axios_1 = require("@nestjs/axios");
let PaymentProcessor = PaymentProcessor_1 = class PaymentProcessor {
    constructor(paymentsService, httpService) {
        this.paymentsService = paymentsService;
        this.httpService = httpService;
        this.logger = new common_1.Logger(PaymentProcessor_1.name);
    }
    async handlePaymentInitiation(job) {
        const { paymentId } = job.data;
        try {
            this.logger.log(`Processing payment initiation: ${paymentId}`);
            await this.paymentsService.initiatePayment(paymentId);
            this.logger.log(`Payment initiated successfully: ${paymentId}`);
        }
        catch (error) {
            this.logger.error(`Payment initiation failed: ${paymentId}`, error);
            throw error;
        }
    }
    async handleRefundProcessing(job) {
        const { refundId, paymentId } = job.data;
        try {
            this.logger.log(`Processing refund: ${refundId} for payment: ${paymentId}`);
            await new Promise(resolve => setTimeout(resolve, 2000));
            this.logger.log(`Refund processed successfully: ${refundId}`);
        }
        catch (error) {
            this.logger.error(`Refund processing failed: ${refundId}`, error);
            throw error;
        }
    }
    async handleCallbackNotification(job) {
        const { paymentId, callbackUrl, status } = job.data;
        try {
            this.logger.log(`Sending callback for payment: ${paymentId}`);
            const payment = await this.paymentsService.getPayment(paymentId);
            const payload = {
                paymentId: payment.id,
                status,
                amount: payment.amount,
                currency: payment.currency,
                externalReference: payment.externalReference,
                timestamp: new Date().toISOString(),
            };
            await this.httpService.post(callbackUrl, payload, {
                timeout: 10000,
                headers: {
                    'Content-Type': 'application/json',
                    'User-Agent': 'TekPay-Gateway/1.0',
                },
            }).toPromise();
            this.logger.log(`Callback sent successfully for payment: ${paymentId}`);
        }
        catch (error) {
            this.logger.error(`Callback failed for payment: ${paymentId}`, error);
            if (job.attemptsMade < 3) {
                throw error;
            }
        }
    }
};
exports.PaymentProcessor = PaymentProcessor;
__decorate([
    (0, bull_1.Process)('initiate-payment'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], PaymentProcessor.prototype, "handlePaymentInitiation", null);
__decorate([
    (0, bull_1.Process)('process-refund'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], PaymentProcessor.prototype, "handleRefundProcessing", null);
__decorate([
    (0, bull_1.Process)('send-callback'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], PaymentProcessor.prototype, "handleCallbackNotification", null);
exports.PaymentProcessor = PaymentProcessor = PaymentProcessor_1 = __decorate([
    (0, bull_1.Processor)('payments'),
    __metadata("design:paramtypes", [payments_service_1.PaymentsService,
        axios_1.HttpService])
], PaymentProcessor);
//# sourceMappingURL=payment.processor.js.map