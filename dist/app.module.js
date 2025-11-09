"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AppModule = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const typeorm_1 = require("@nestjs/typeorm");
const bull_1 = require("@nestjs/bull");
const common_module_1 = require("./common/common.module");
const auth_module_1 = require("./auth/auth.module");
const payments_module_1 = require("./payments/payments.module");
const mno_module_1 = require("./mno/mno.module");
const webhooks_module_1 = require("./webhooks/webhooks.module");
const admin_module_1 = require("./admin/admin.module");
const billing_module_1 = require("./billing/billing.module");
const jobs_module_1 = require("./jobs/jobs.module");
const audit_module_1 = require("./audit/audit.module");
const app_controller_1 = require("./app.controller");
const app_service_1 = require("./app.service");
const config_validation_1 = require("./common/config/config.validation");
let AppModule = class AppModule {
};
exports.AppModule = AppModule;
exports.AppModule = AppModule = __decorate([
    (0, common_1.Module)({
        imports: [
            config_1.ConfigModule.forRoot({
                isGlobal: true,
                envFilePath: '.env',
                validate: config_validation_1.validate,
            }),
            typeorm_1.TypeOrmModule.forRoot({
                type: 'postgres',
                host: process.env.DATABASE_HOST || 'localhost',
                port: parseInt(process.env.DATABASE_PORT, 10) || 5432,
                username: process.env.DATABASE_USERNAME || 'postgres',
                password: process.env.DATABASE_PASSWORD || 'postgres',
                database: process.env.DATABASE_NAME || 'tekpay_gateway',
                autoLoadEntities: true,
                synchronize: process.env.NODE_ENV === 'development',
                logging: process.env.NODE_ENV === 'development',
            }),
            bull_1.BullModule.forRoot({
                redis: {
                    host: process.env.REDIS_HOST || 'localhost',
                    port: parseInt(process.env.REDIS_PORT, 10) || 6379,
                },
            }),
            common_module_1.CommonModule,
            auth_module_1.AuthModule,
            payments_module_1.PaymentsModule,
            mno_module_1.MnoModule,
            webhooks_module_1.WebhooksModule,
            admin_module_1.AdminModule,
            billing_module_1.BillingModule,
            jobs_module_1.JobsModule,
            audit_module_1.AuditModule,
        ],
        controllers: [app_controller_1.AppController],
        providers: [app_service_1.AppService],
    })
], AppModule);
//# sourceMappingURL=app.module.js.map