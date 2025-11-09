"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.BillingModule = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const billing_controller_1 = require("./billing.controller");
const billing_service_1 = require("./billing.service");
const usage_billing_entity_1 = require("./entities/usage-billing.entity");
const auth_module_1 = require("../auth/auth.module");
let BillingModule = class BillingModule {
};
exports.BillingModule = BillingModule;
exports.BillingModule = BillingModule = __decorate([
    (0, common_1.Module)({
        imports: [
            typeorm_1.TypeOrmModule.forFeature([usage_billing_entity_1.UsageBilling]),
            auth_module_1.AuthModule,
        ],
        controllers: [billing_controller_1.BillingController],
        providers: [billing_service_1.BillingService],
        exports: [billing_service_1.BillingService, typeorm_1.TypeOrmModule],
    })
], BillingModule);
//# sourceMappingURL=billing.module.js.map