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
Object.defineProperty(exports, "__esModule", { value: true });
exports.ApiConsumer = void 0;
const typeorm_1 = require("typeorm");
const base_entity_1 = require("../../common/entities/base.entity");
const payment_enum_1 = require("../../common/enums/payment.enum");
const payment_entity_1 = require("../../payments/entities/payment.entity");
const usage_billing_entity_1 = require("../../billing/entities/usage-billing.entity");
let ApiConsumer = class ApiConsumer extends base_entity_1.BaseEntity {
};
exports.ApiConsumer = ApiConsumer;
__decorate([
    (0, typeorm_1.Column)({ unique: true }),
    __metadata("design:type", String)
], ApiConsumer.prototype, "name", void 0);
__decorate([
    (0, typeorm_1.Column)({ unique: true }),
    __metadata("design:type", String)
], ApiConsumer.prototype, "email", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'api_key', unique: true }),
    __metadata("design:type", String)
], ApiConsumer.prototype, "apiKey", void 0);
__decorate([
    (0, typeorm_1.Column)({
        type: 'enum',
        enum: payment_enum_1.PricingPlan,
        default: payment_enum_1.PricingPlan.STANDARD,
        name: 'pricing_plan',
    }),
    __metadata("design:type", String)
], ApiConsumer.prototype, "pricingPlan", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'monthly_quota', default: 10000 }),
    __metadata("design:type", Number)
], ApiConsumer.prototype, "monthlyQuota", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'is_active', default: true }),
    __metadata("design:type", Boolean)
], ApiConsumer.prototype, "isActive", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'jsonb', nullable: true }),
    __metadata("design:type", Object)
], ApiConsumer.prototype, "metadata", void 0);
__decorate([
    (0, typeorm_1.OneToMany)(() => payment_entity_1.Payment, (payment) => payment.consumer),
    __metadata("design:type", Array)
], ApiConsumer.prototype, "payments", void 0);
__decorate([
    (0, typeorm_1.OneToMany)(() => usage_billing_entity_1.UsageBilling, (usage) => usage.consumer),
    __metadata("design:type", Array)
], ApiConsumer.prototype, "usageBilling", void 0);
exports.ApiConsumer = ApiConsumer = __decorate([
    (0, typeorm_1.Entity)('api_consumers')
], ApiConsumer);
//# sourceMappingURL=api-consumer.entity.js.map