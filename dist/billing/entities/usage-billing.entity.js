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
exports.UsageBilling = void 0;
const typeorm_1 = require("typeorm");
const base_entity_1 = require("../../common/entities/base.entity");
const api_consumer_entity_1 = require("../../auth/entities/api-consumer.entity");
let UsageBilling = class UsageBilling extends base_entity_1.BaseEntity {
};
exports.UsageBilling = UsageBilling;
__decorate([
    (0, typeorm_1.ManyToOne)(() => api_consumer_entity_1.ApiConsumer, (consumer) => consumer.usageBilling),
    (0, typeorm_1.JoinColumn)({ name: 'consumer_id' }),
    __metadata("design:type", api_consumer_entity_1.ApiConsumer)
], UsageBilling.prototype, "consumer", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'consumer_id' }),
    __metadata("design:type", String)
], UsageBilling.prototype, "consumerId", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'api_calls', default: 0 }),
    __metadata("design:type", Number)
], UsageBilling.prototype, "apiCalls", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'total_volume', type: 'decimal', precision: 12, scale: 2, default: 0 }),
    __metadata("design:type", Number)
], UsageBilling.prototype, "totalVolume", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'billing_period' }),
    __metadata("design:type", String)
], UsageBilling.prototype, "billingPeriod", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'decimal', precision: 12, scale: 2, default: 0 }),
    __metadata("design:type", Number)
], UsageBilling.prototype, "charges", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'last_updated', type: 'timestamptz', default: () => 'CURRENT_TIMESTAMP' }),
    __metadata("design:type", Date)
], UsageBilling.prototype, "lastUpdated", void 0);
exports.UsageBilling = UsageBilling = __decorate([
    (0, typeorm_1.Entity)('usage_billing'),
    (0, typeorm_1.Index)(['consumerId', 'billingPeriod'], { unique: true })
], UsageBilling);
//# sourceMappingURL=usage-billing.entity.js.map