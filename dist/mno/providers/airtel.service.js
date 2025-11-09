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
var AirtelService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.AirtelService = void 0;
const common_1 = require("@nestjs/common");
const axios_1 = require("@nestjs/axios");
const config_1 = require("@nestjs/config");
const uuid_1 = require("uuid");
let AirtelService = AirtelService_1 = class AirtelService {
    constructor(httpService, configService) {
        this.httpService = httpService;
        this.configService = configService;
        this.logger = new common_1.Logger(AirtelService_1.name);
        this.baseUrl = this.configService.get('AIRTEL_BASE_URL');
        this.clientId = this.configService.get('AIRTEL_CLIENT_ID');
        this.clientSecret = this.configService.get('AIRTEL_CLIENT_SECRET');
    }
    async initiatePayment(request) {
        try {
            this.logger.log(`Initiating Airtel payment for ${request.phoneNumber}`);
            const accessToken = await this.getAccessToken();
            const paymentData = {
                reference: request.externalReference || (0, uuid_1.v4)(),
                subscriber: {
                    country: 'ZM',
                    currency: 'ZMW',
                    msisdn: this.formatPhoneNumber(request.phoneNumber),
                },
                transaction: {
                    amount: request.amount,
                    country: 'ZM',
                    currency: 'ZMW',
                    id: (0, uuid_1.v4)(),
                },
            };
            const response = await this.httpService.post(`${this.baseUrl}/merchant/v1/payments/`, paymentData, {
                headers: {
                    'Authorization': `Bearer ${accessToken}`,
                    'Content-Type': 'application/json',
                    'X-Country': 'ZM',
                    'X-Currency': 'ZMW',
                },
                timeout: 30000,
            }).toPromise();
            const data = response.data;
            if (data.status && data.status.success) {
                this.logger.log(`Airtel payment initiated successfully: ${data.data.transaction.id}`);
                return {
                    success: true,
                    reference: data.data.transaction.id,
                    transactionId: data.data.transaction.id,
                    message: data.status.message || 'Payment initiated successfully',
                };
            }
            else {
                throw new Error(data.status?.message || 'Payment initiation failed');
            }
        }
        catch (error) {
            this.logger.error(`Airtel payment initiation failed: ${error.message}`);
            return {
                success: false,
                reference: `airtel_failed_${Date.now()}`,
                message: error.response?.data?.status?.message || error.message,
            };
        }
    }
    async checkPaymentStatus(reference) {
        try {
            this.logger.log(`Checking Airtel payment status: ${reference}`);
            const accessToken = await this.getAccessToken();
            const response = await this.httpService.get(`${this.baseUrl}/standard/v1/payments/${reference}`, {
                headers: {
                    'Authorization': `Bearer ${accessToken}`,
                    'X-Country': 'ZM',
                    'X-Currency': 'ZMW',
                },
                timeout: 15000,
            }).toPromise();
            const data = response.data;
            if (data.status && data.status.success) {
                return {
                    reference,
                    status: this.mapAirtelStatus(data.data.transaction.status),
                    amount: parseFloat(data.data.transaction.amount),
                    currency: data.data.transaction.currency,
                    transactionId: data.data.transaction.id,
                    timestamp: data.data.transaction.created_at || new Date().toISOString(),
                };
            }
            else {
                throw new Error(data.status?.message || 'Failed to check payment status');
            }
        }
        catch (error) {
            this.logger.error(`Airtel status check failed: ${error.message}`);
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
            this.logger.log(`Processing Airtel refund: ${paymentReference}, amount: ${amount}`);
            const accessToken = await this.getAccessToken();
            const refundId = (0, uuid_1.v4)();
            const refundData = {
                transaction: {
                    amount: amount,
                    country: 'ZM',
                    currency: 'ZMW',
                    id: refundId,
                },
                reference: {
                    transaction: paymentReference,
                },
            };
            const response = await this.httpService.post(`${this.baseUrl}/standard/v1/payments/refund`, refundData, {
                headers: {
                    'Authorization': `Bearer ${accessToken}`,
                    'Content-Type': 'application/json',
                    'X-Country': 'ZM',
                    'X-Currency': 'ZMW',
                },
                timeout: 30000,
            }).toPromise();
            const data = response.data;
            if (data.status && data.status.success) {
                return {
                    success: true,
                    refundId: data.data.transaction.id,
                    amount,
                    status: 'processing',
                    message: data.status.message || 'Refund initiated successfully',
                };
            }
            else {
                throw new Error(data.status?.message || 'Refund processing failed');
            }
        }
        catch (error) {
            this.logger.error(`Airtel refund failed: ${error.message}`);
            throw error;
        }
    }
    async getAccessToken() {
        try {
            const response = await this.httpService.post(`${this.baseUrl}/auth/oauth2/token`, {
                client_id: this.clientId,
                client_secret: this.clientSecret,
                grant_type: 'client_credentials',
            }, {
                headers: {
                    'Content-Type': 'application/json',
                },
                timeout: 15000,
            }).toPromise();
            return response.data.access_token;
        }
        catch (error) {
            this.logger.error(`Failed to get Airtel access token: ${error.message}`);
            throw new Error('Failed to authenticate with Airtel API');
        }
    }
    formatPhoneNumber(phoneNumber) {
        let cleaned = phoneNumber.replace(/\D/g, '');
        if (cleaned.startsWith('260')) {
            return cleaned;
        }
        if (cleaned.startsWith('9') || cleaned.startsWith('7')) {
            return '260' + cleaned;
        }
        return '260' + cleaned;
    }
    mapAirtelStatus(airtelStatus) {
        const statusMap = {
            'TS': 'completed',
            'TF': 'failed',
            'TA': 'pending',
            'TI': 'pending',
            'TP': 'pending',
        };
        return statusMap[airtelStatus] || 'unknown';
    }
};
exports.AirtelService = AirtelService;
exports.AirtelService = AirtelService = AirtelService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [axios_1.HttpService,
        config_1.ConfigService])
], AirtelService);
//# sourceMappingURL=airtel.service.js.map