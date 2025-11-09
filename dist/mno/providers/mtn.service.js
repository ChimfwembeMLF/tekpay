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
var MtnService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.MtnService = void 0;
const common_1 = require("@nestjs/common");
const axios_1 = require("@nestjs/axios");
const config_1 = require("@nestjs/config");
const uuid_1 = require("uuid");
let MtnService = MtnService_1 = class MtnService {
    constructor(httpService, configService) {
        this.httpService = httpService;
        this.configService = configService;
        this.logger = new common_1.Logger(MtnService_1.name);
        this.baseUrl = this.configService.get('MTN_BASE_URL');
        this.clientId = this.configService.get('MTN_CLIENT_ID');
        this.clientSecret = this.configService.get('MTN_CLIENT_SECRET');
        this.subscriptionKey = this.configService.get('MTN_SUBSCRIPTION_KEY');
    }
    async initiatePayment(request) {
        try {
            this.logger.log(`Initiating MTN payment for ${request.phoneNumber}`);
            const accessToken = await this.getAccessToken();
            const paymentData = {
                amount: request.amount.toString(),
                currency: 'ZMW',
                externalId: request.externalReference || (0, uuid_1.v4)(),
                payer: {
                    partyIdType: 'MSISDN',
                    partyId: this.formatPhoneNumber(request.phoneNumber),
                },
                payerMessage: 'Payment request',
                payeeNote: `Payment for ${request.externalReference || 'order'}`,
            };
            const requestId = (0, uuid_1.v4)();
            const targetEnvironment = this.configService.get('MTN_ENVIRONMENT', 'sandbox');
            const response = await this.httpService.post(`${this.baseUrl}/collection/v1_0/requesttopay`, paymentData, {
                headers: {
                    'Authorization': `Bearer ${accessToken}`,
                    'X-Reference-Id': requestId,
                    'X-Target-Environment': targetEnvironment,
                    'Ocp-Apim-Subscription-Key': this.subscriptionKey,
                    'Content-Type': 'application/json',
                },
                timeout: 30000,
            }).toPromise();
            if (response.status === 202) {
                this.logger.log(`MTN payment initiated successfully: ${requestId}`);
                return {
                    success: true,
                    reference: requestId,
                    transactionId: requestId,
                    message: 'Payment initiated successfully',
                };
            }
            else {
                throw new Error(`Unexpected response status: ${response.status}`);
            }
        }
        catch (error) {
            this.logger.error(`MTN payment initiation failed: ${error.message}`);
            return {
                success: false,
                reference: `mtn_failed_${Date.now()}`,
                message: error.response?.data?.message || error.message,
            };
        }
    }
    async checkPaymentStatus(reference) {
        try {
            this.logger.log(`Checking MTN payment status: ${reference}`);
            const accessToken = await this.getAccessToken();
            const targetEnvironment = this.configService.get('MTN_ENVIRONMENT', 'sandbox');
            const response = await this.httpService.get(`${this.baseUrl}/collection/v1_0/requesttopay/${reference}`, {
                headers: {
                    'Authorization': `Bearer ${accessToken}`,
                    'X-Target-Environment': targetEnvironment,
                    'Ocp-Apim-Subscription-Key': this.subscriptionKey,
                },
                timeout: 15000,
            }).toPromise();
            const data = response.data;
            return {
                reference,
                status: this.mapMtnStatus(data.status),
                amount: parseFloat(data.amount),
                currency: data.currency,
                externalId: data.externalId,
                payerMessage: data.payerMessage,
                payeeNote: data.payeeNote,
                timestamp: data.createdAt || new Date().toISOString(),
            };
        }
        catch (error) {
            this.logger.error(`MTN status check failed: ${error.message}`);
            if (error.response?.status === 404) {
                return {
                    reference,
                    status: 'not_found',
                    message: 'Payment not found',
                };
            }
            throw error;
        }
    }
    async processRefund(paymentReference, amount) {
        try {
            this.logger.log(`Processing MTN refund: ${paymentReference}, amount: ${amount}`);
            const accessToken = await this.getAccessToken();
            const refundId = (0, uuid_1.v4)();
            const targetEnvironment = this.configService.get('MTN_ENVIRONMENT', 'sandbox');
            const refundData = {
                amount: amount.toString(),
                currency: 'ZMW',
                externalId: refundId,
                payerMessage: 'Refund processed',
                payeeNote: `Refund for payment ${paymentReference}`,
            };
            const response = await this.httpService.post(`${this.baseUrl}/collection/v1_0/refund`, refundData, {
                headers: {
                    'Authorization': `Bearer ${accessToken}`,
                    'X-Reference-Id': refundId,
                    'X-Target-Environment': targetEnvironment,
                    'Ocp-Apim-Subscription-Key': this.subscriptionKey,
                    'Content-Type': 'application/json',
                },
                timeout: 30000,
            }).toPromise();
            if (response.status === 202) {
                return {
                    success: true,
                    refundId,
                    amount,
                    status: 'processing',
                    message: 'Refund initiated successfully',
                };
            }
            else {
                throw new Error(`Unexpected response status: ${response.status}`);
            }
        }
        catch (error) {
            this.logger.error(`MTN refund failed: ${error.message}`);
            throw error;
        }
    }
    async getAccessToken() {
        try {
            const response = await this.httpService.post(`${this.baseUrl}/collection/token/`, {}, {
                headers: {
                    'Authorization': `Basic ${Buffer.from(`${this.clientId}:${this.clientSecret}`).toString('base64')}`,
                    'Ocp-Apim-Subscription-Key': this.subscriptionKey,
                },
                timeout: 15000,
            }).toPromise();
            return response.data.access_token;
        }
        catch (error) {
            this.logger.error(`Failed to get MTN access token: ${error.message}`);
            throw new Error('Failed to authenticate with MTN API');
        }
    }
    formatPhoneNumber(phoneNumber) {
        let cleaned = phoneNumber.replace(/\D/g, '');
        if (cleaned.startsWith('260')) {
            cleaned = cleaned.substring(3);
        }
        if (!cleaned.startsWith('9')) {
            cleaned = '9' + cleaned.substring(1);
        }
        return cleaned;
    }
    mapMtnStatus(mtnStatus) {
        const statusMap = {
            'PENDING': 'pending',
            'SUCCESSFUL': 'completed',
            'FAILED': 'failed',
            'TIMEOUT': 'expired',
            'CANCELLED': 'failed',
        };
        return statusMap[mtnStatus] || 'unknown';
    }
};
exports.MtnService = MtnService;
exports.MtnService = MtnService = MtnService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [axios_1.HttpService,
        config_1.ConfigService])
], MtnService);
//# sourceMappingURL=mtn.service.js.map