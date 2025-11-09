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
exports.BillingService = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const usage_billing_entity_1 = require("./entities/usage-billing.entity");
const payment_enum_1 = require("../common/enums/payment.enum");
let BillingService = class BillingService {
    constructor(usageBillingRepository) {
        this.usageBillingRepository = usageBillingRepository;
    }
    async logApiUsage(consumerId, calls, volume) {
        const billingPeriod = this.getCurrentBillingPeriod();
        let usage = await this.usageBillingRepository.findOne({
            where: { consumerId, billingPeriod },
        });
        if (!usage) {
            usage = this.usageBillingRepository.create({
                consumerId,
                billingPeriod,
                apiCalls: 0,
                totalVolume: 0,
                charges: 0,
            });
        }
        usage.apiCalls += calls;
        usage.totalVolume = Number(usage.totalVolume) + volume;
        usage.lastUpdated = new Date();
        await this.usageBillingRepository.save(usage);
    }
    async getUsage(consumerId, period) {
        const billingPeriod = period || this.getCurrentBillingPeriod();
        let usage = await this.usageBillingRepository.findOne({
            where: { consumerId, billingPeriod },
        });
        if (!usage) {
            usage = this.usageBillingRepository.create({
                consumerId,
                billingPeriod,
                apiCalls: 0,
                totalVolume: 0,
                charges: 0,
            });
        }
        return usage;
    }
    async calculateCharges(consumer, usage) {
        const rates = this.getPricingRates(consumer.pricingPlan);
        let charges = 0;
        charges += usage.apiCalls * rates.perCall;
        charges += Number(usage.totalVolume) * rates.volumePercentage;
        if (usage.apiCalls > consumer.monthlyQuota) {
            const overage = usage.apiCalls - consumer.monthlyQuota;
            charges += overage * rates.overageRate;
        }
        return Math.round(charges * 100) / 100;
    }
    async updateCharges(consumerId, period) {
        const billingPeriod = period || this.getCurrentBillingPeriod();
        const usage = await this.usageBillingRepository.findOne({
            where: { consumerId, billingPeriod },
            relations: ['consumer'],
        });
        if (usage && usage.consumer) {
            const charges = await this.calculateCharges(usage.consumer, usage);
            usage.charges = charges;
            await this.usageBillingRepository.save(usage);
        }
    }
    getCurrentBillingPeriod() {
        const now = new Date();
        return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
    }
    getPricingRates(plan) {
        const rates = {
            [payment_enum_1.PricingPlan.BASIC]: {
                perCall: 0.01,
                volumePercentage: 0.001,
                overageRate: 0.02,
            },
            [payment_enum_1.PricingPlan.STANDARD]: {
                perCall: 0.008,
                volumePercentage: 0.0008,
                overageRate: 0.015,
            },
            [payment_enum_1.PricingPlan.PREMIUM]: {
                perCall: 0.006,
                volumePercentage: 0.0006,
                overageRate: 0.01,
            },
            [payment_enum_1.PricingPlan.ENTERPRISE]: {
                perCall: 0.004,
                volumePercentage: 0.0004,
                overageRate: 0.008,
            },
        };
        return rates[plan] || rates[payment_enum_1.PricingPlan.STANDARD];
    }
};
exports.BillingService = BillingService;
exports.BillingService = BillingService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(usage_billing_entity_1.UsageBilling)),
    __metadata("design:paramtypes", [typeorm_2.Repository])
], BillingService);
//# sourceMappingURL=billing.service.js.map