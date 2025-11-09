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
exports.Transaction = void 0;
const typeorm_1 = require("typeorm");
const base_entity_1 = require("../../common/entities/base.entity");
const payment_enum_1 = require("../../common/enums/payment.enum");
const payment_entity_1 = require("./payment.entity");
let Transaction = class Transaction extends base_entity_1.BaseEntity {
};
exports.Transaction = Transaction;
__decorate([
    (0, typeorm_1.ManyToOne)(() => payment_entity_1.Payment, (payment) => payment.transactions),
    (0, typeorm_1.JoinColumn)({ name: 'payment_id' }),
    __metadata("design:type", payment_entity_1.Payment)
], Transaction.prototype, "payment", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'payment_id', nullable: true }),
    __metadata("design:type", String)
], Transaction.prototype, "paymentId", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'mno_transaction_id', nullable: true }),
    __metadata("design:type", String)
], Transaction.prototype, "mnoTransactionId", void 0);
__decorate([
    (0, typeorm_1.Column)({
        type: 'enum',
        enum: payment_enum_1.TransactionType,
    }),
    __metadata("design:type", String)
], Transaction.prototype, "type", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'decimal', precision: 12, scale: 2 }),
    __metadata("design:type", Number)
], Transaction.prototype, "amount", void 0);
__decorate([
    (0, typeorm_1.Column)({
        type: 'enum',
        enum: payment_enum_1.Currency,
        default: payment_enum_1.Currency.ZMW,
    }),
    __metadata("design:type", String)
], Transaction.prototype, "currency", void 0);
__decorate([
    (0, typeorm_1.Column)(),
    __metadata("design:type", String)
], Transaction.prototype, "status", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'jsonb', nullable: true, name: 'raw_payload' }),
    __metadata("design:type", Object)
], Transaction.prototype, "rawPayload", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'processed_at', type: 'timestamptz', nullable: true }),
    __metadata("design:type", Date)
], Transaction.prototype, "processedAt", void 0);
exports.Transaction = Transaction = __decorate([
    (0, typeorm_1.Entity)('transactions')
], Transaction);
//# sourceMappingURL=transaction.entity.js.map