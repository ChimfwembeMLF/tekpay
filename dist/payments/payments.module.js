"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.PaymentsModule = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const bull_1 = require("@nestjs/bull");
const payments_controller_1 = require("./payments.controller");
const payments_service_1 = require("./payments.service");
const payment_entity_1 = require("./entities/payment.entity");
const transaction_entity_1 = require("./entities/transaction.entity");
const auth_module_1 = require("../auth/auth.module");
const mno_module_1 = require("../mno/mno.module");
const billing_module_1 = require("../billing/billing.module");
const audit_module_1 = require("../audit/audit.module");
let PaymentsModule = class PaymentsModule {
};
exports.PaymentsModule = PaymentsModule;
exports.PaymentsModule = PaymentsModule = __decorate([
    (0, common_1.Module)({
        imports: [
            typeorm_1.TypeOrmModule.forFeature([payment_entity_1.Payment, transaction_entity_1.Transaction]),
            bull_1.BullModule.registerQueue({
                name: 'payments',
            }),
            auth_module_1.AuthModule,
            mno_module_1.MnoModule,
            billing_module_1.BillingModule,
            audit_module_1.AuditModule,
        ],
        controllers: [payments_controller_1.PaymentsController],
        providers: [payments_service_1.PaymentsService],
        exports: [payments_service_1.PaymentsService, typeorm_1.TypeOrmModule],
    })
], PaymentsModule);
//# sourceMappingURL=payments.module.js.map