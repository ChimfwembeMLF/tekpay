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
exports.MonitoringController = void 0;
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const health_service_1 = require("../services/health.service");
const metrics_service_1 = require("../services/metrics.service");
const logger_service_1 = require("../services/logger.service");
let MonitoringController = class MonitoringController {
    constructor(healthService, metricsService, logger) {
        this.healthService = healthService;
        this.metricsService = metricsService;
        this.logger = logger;
    }
    async getHealth() {
        const startTime = Date.now();
        try {
            const health = await this.healthService.getHealthStatus();
            this.metricsService.recordTimer('health_check.duration', Date.now() - startTime);
            this.metricsService.incrementCounter('health_check.requests.total', 1, {
                status: health.status
            });
            return health;
        }
        catch (error) {
            this.logger.error('Health check failed', error);
            this.metricsService.incrementCounter('health_check.requests.total', 1, {
                status: 'error'
            });
            throw error;
        }
    }
    getLiveness() {
        return {
            status: 'alive',
            timestamp: new Date().toISOString(),
        };
    }
    async getReadiness() {
        try {
            const health = await this.healthService.getHealthStatus();
            const ready = health.status === 'healthy' || health.status === 'degraded';
            return {
                status: ready ? 'ready' : 'not_ready',
                timestamp: new Date().toISOString(),
                ready,
            };
        }
        catch (error) {
            this.logger.error('Readiness check failed', error);
            return {
                status: 'not_ready',
                timestamp: new Date().toISOString(),
                ready: false,
            };
        }
    }
    getMetrics() {
        try {
            this.metricsService.recordMemoryUsage();
            this.metricsService.recordCpuUsage();
            const metrics = this.metricsService.getAllMetrics();
            this.metricsService.incrementCounter('metrics.requests.total', 1, {
                format: 'json'
            });
            return {
                timestamp: new Date().toISOString(),
                metrics,
            };
        }
        catch (error) {
            this.logger.error('Failed to get metrics', error);
            throw error;
        }
    }
    getPrometheusMetrics() {
        try {
            this.metricsService.recordMemoryUsage();
            this.metricsService.recordCpuUsage();
            const metrics = this.metricsService.getPrometheusMetrics();
            this.metricsService.incrementCounter('metrics.requests.total', 1, {
                format: 'prometheus'
            });
            return metrics;
        }
        catch (error) {
            this.logger.error('Failed to get Prometheus metrics', error);
            throw error;
        }
    }
    getVersion() {
        return {
            version: process.env.npm_package_version || '1.0.0',
            environment: process.env.NODE_ENV || 'development',
            buildTime: process.env.BUILD_TIME,
            gitCommit: process.env.GIT_COMMIT,
            nodeVersion: process.version,
        };
    }
    getStatus() {
        return {
            status: 'running',
            timestamp: new Date().toISOString(),
            uptime: process.uptime(),
            environment: process.env.NODE_ENV || 'development',
        };
    }
};
exports.MonitoringController = MonitoringController;
__decorate([
    (0, common_1.Get)('health'),
    (0, common_1.HttpCode)(common_1.HttpStatus.OK),
    (0, swagger_1.ApiOperation)({ summary: 'Health check endpoint' }),
    (0, swagger_1.ApiResponse)({
        status: 200,
        description: 'Health check results',
        schema: {
            type: 'object',
            properties: {
                status: { type: 'string', enum: ['healthy', 'unhealthy', 'degraded'] },
                timestamp: { type: 'string' },
                uptime: { type: 'number' },
                version: { type: 'string' },
                environment: { type: 'string' },
                checks: {
                    type: 'object',
                    properties: {
                        database: { $ref: '#/components/schemas/HealthCheck' },
                        redis: { $ref: '#/components/schemas/HealthCheck' },
                        mtn: { $ref: '#/components/schemas/HealthCheck' },
                        airtel: { $ref: '#/components/schemas/HealthCheck' },
                        memory: { $ref: '#/components/schemas/HealthCheck' },
                        disk: { $ref: '#/components/schemas/HealthCheck' },
                    },
                },
            },
        },
    }),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], MonitoringController.prototype, "getHealth", null);
__decorate([
    (0, common_1.Get)('health/live'),
    (0, common_1.HttpCode)(common_1.HttpStatus.OK),
    (0, swagger_1.ApiOperation)({ summary: 'Liveness probe - basic application status' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Application is running' }),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Object)
], MonitoringController.prototype, "getLiveness", null);
__decorate([
    (0, common_1.Get)('health/ready'),
    (0, common_1.HttpCode)(common_1.HttpStatus.OK),
    (0, swagger_1.ApiOperation)({ summary: 'Readiness probe - application ready to serve traffic' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Application is ready' }),
    (0, swagger_1.ApiResponse)({ status: 503, description: 'Application is not ready' }),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], MonitoringController.prototype, "getReadiness", null);
__decorate([
    (0, common_1.Get)('metrics'),
    (0, common_1.Header)('Content-Type', 'application/json'),
    (0, swagger_1.ApiOperation)({ summary: 'Application metrics in JSON format' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Application metrics' }),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Object)
], MonitoringController.prototype, "getMetrics", null);
__decorate([
    (0, common_1.Get)('metrics/prometheus'),
    (0, common_1.Header)('Content-Type', 'text/plain; version=0.0.4; charset=utf-8'),
    (0, swagger_1.ApiOperation)({ summary: 'Application metrics in Prometheus format' }),
    (0, swagger_1.ApiResponse)({
        status: 200,
        description: 'Application metrics in Prometheus format',
        content: {
            'text/plain': {
                schema: { type: 'string' }
            }
        }
    }),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", String)
], MonitoringController.prototype, "getPrometheusMetrics", null);
__decorate([
    (0, common_1.Get)('version'),
    (0, swagger_1.ApiOperation)({ summary: 'Application version information' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Version information' }),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Object)
], MonitoringController.prototype, "getVersion", null);
__decorate([
    (0, common_1.Get)('status'),
    (0, swagger_1.ApiOperation)({ summary: 'Simple status endpoint' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Service status' }),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Object)
], MonitoringController.prototype, "getStatus", null);
exports.MonitoringController = MonitoringController = __decorate([
    (0, swagger_1.ApiTags)('Monitoring'),
    (0, common_1.Controller)(),
    __metadata("design:paramtypes", [health_service_1.HealthService,
        metrics_service_1.MetricsService,
        logger_service_1.LoggerService])
], MonitoringController);
//# sourceMappingURL=monitoring.controller.js.map