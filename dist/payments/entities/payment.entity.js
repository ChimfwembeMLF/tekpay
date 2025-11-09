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
exports.Payment = void 0;
const typeorm_1 = require("typeorm");
const base_entity_1 = require("../../common/entities/base.entity");
const payment_enum_1 = require("../../common/enums/payment.enum");
const api_consumer_entity_1 = require("../../auth/entities/api-consumer.entity");
const transaction_entity_1 = require("./transaction.entity");
let Payment = class Payment extends base_entity_1.BaseEntity {
};
exports.Payment = Payment;
__decorate([
    (0, typeorm_1.ManyToOne)(() => api_consumer_entity_1.ApiConsumer, (consumer) => consumer.payments),
    (0, typeorm_1.JoinColumn)({ name: 'consumer_id' }),
    __metadata("design:type", api_consumer_entity_1.ApiConsumer)
], Payment.prototype, "consumer", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'consumer_id' }),
    __metadata("design:type", String)
], Payment.prototype, "consumerId", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'external_reference', nullable: true }),
    __metadata("design:type", String)
], Payment.prototype, "externalReference", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'decimal', precision: 12, scale: 2 }),
    __metadata("design:type", Number)
], Payment.prototype, "amount", void 0);
__decorate([
    (0, typeorm_1.Column)({
        type: 'enum',
        enum: payment_enum_1.Currency,
        default: payment_enum_1.Currency.ZMW,
    }),
    __metadata("design:type", String)
], Payment.prototype, "currency", void 0);
__decorate([
    (0, typeorm_1.Column)({
        type: 'enum',
        enum: payment_enum_1.MNOProvider,
    }),
    __metadata("design:type", String)
], Payment.prototype, "mno", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'phone_number' }),
    __metadata("design:type", String)
], Payment.prototype, "phoneNumber", void 0);
__decorate([
    (0, typeorm_1.Column)({
        type: 'enum',
        enum: payment_enum_1.PaymentStatus,
        default: payment_enum_1.PaymentStatus.CREATED,
    }),
    __metadata("design:type", String)
], Payment.prototype, "status", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'mno_reference', nullable: true }),
    __metadata("design:type", String)
], Payment.prototype, "mnoReference", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'jsonb', nullable: true }),
    __metadata("design:type", Object)
], Payment.prototype, "metadata", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'expires_at', type: 'timestamptz', nullable: true }),
    __metadata("design:type", Date)
], Payment.prototype, "expiresAt", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'callback_url', nullable: true }),
    __metadata("design:type", String)
], Payment.prototype, "callbackUrl", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'idempotency_key', nullable: true }),
    __metadata("design:type", String)
], Payment.prototype, "idempotencyKey", void 0);
__decorate([
    (0, typeorm_1.OneToMany)(() => transaction_entity_1.Transaction, (transaction) => transaction.payment),
    __metadata("design:type", Array)
], Payment.prototype, "transactions", void 0);
exports.Payment = Payment = __decorate([
    (0, typeorm_1.Entity)('payments')
], Payment);
//# sourceMappingURL=payment.entity.js.map