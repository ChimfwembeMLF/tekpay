"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.CommonModule = void 0;
const common_1 = require("@nestjs/common");
const axios_1 = require("@nestjs/axios");
const core_1 = require("@nestjs/core");
const logger_service_1 = require("./services/logger.service");
const health_service_1 = require("./services/health.service");
const metrics_service_1 = require("./services/metrics.service");
const performance_service_1 = require("./services/performance.service");
const monitoring_controller_1 = require("./controllers/monitoring.controller");
const security_guard_1 = require("./guards/security.guard");
const error_handling_interceptor_1 = require("./interceptors/error-handling.interceptor");
const request_logging_interceptor_1 = require("./interceptors/request-logging.interceptor");
let CommonModule = class CommonModule {
};
exports.CommonModule = CommonModule;
exports.CommonModule = CommonModule = __decorate([
    (0, common_1.Global)(),
    (0, common_1.Module)({
        imports: [axios_1.HttpModule],
        providers: [
            logger_service_1.LoggerService,
            health_service_1.HealthService,
            metrics_service_1.MetricsService,
            performance_service_1.PerformanceService,
            security_guard_1.SecurityGuard,
            {
                provide: core_1.APP_GUARD,
                useClass: security_guard_1.SecurityGuard,
            },
            {
                provide: core_1.APP_INTERCEPTOR,
                useClass: request_logging_interceptor_1.RequestLoggingInterceptor,
            },
            {
                provide: core_1.APP_INTERCEPTOR,
                useClass: error_handling_interceptor_1.ErrorHandlingInterceptor,
            },
        ],
        controllers: [monitoring_controller_1.MonitoringController],
        exports: [
            logger_service_1.LoggerService,
            health_service_1.HealthService,
            metrics_service_1.MetricsService,
            performance_service_1.PerformanceService,
            security_guard_1.SecurityGuard,
        ],
    })
], CommonModule);
//# sourceMappingURL=common.module.js.map