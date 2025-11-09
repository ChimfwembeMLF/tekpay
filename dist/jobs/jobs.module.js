"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.JobsModule = void 0;
const common_1 = require("@nestjs/common");
const bull_1 = require("@nestjs/bull");
const payment_processor_1 = require("./processors/payment.processor");
const reconciliation_processor_1 = require("./processors/reconciliation.processor");
const payments_module_1 = require("../payments/payments.module");
const mno_module_1 = require("../mno/mno.module");
const billing_module_1 = require("../billing/billing.module");
const audit_module_1 = require("../audit/audit.module");
const axios_1 = require("@nestjs/axios");
let JobsModule = class JobsModule {
};
exports.JobsModule = JobsModule;
exports.JobsModule = JobsModule = __decorate([
    (0, common_1.Module)({
        imports: [
            bull_1.BullModule.registerQueue({ name: 'payments' }, { name: 'reconciliation' }),
            payments_module_1.PaymentsModule,
            mno_module_1.MnoModule,
            billing_module_1.BillingModule,
            audit_module_1.AuditModule,
            axios_1.HttpModule,
        ],
        providers: [payment_processor_1.PaymentProcessor, reconciliation_processor_1.ReconciliationProcessor],
    })
], JobsModule);
//# sourceMappingURL=jobs.module.js.map