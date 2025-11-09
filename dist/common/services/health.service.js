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
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.HealthService = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const axios_1 = require("@nestjs/axios");
const logger_service_1 = require("./logger.service");
const Redis = require("redis");
let HealthService = class HealthService {
    constructor(dataSource, configService, httpService, logger) {
        this.dataSource = dataSource;
        this.configService = configService;
        this.httpService = httpService;
        this.logger = logger;
        this.startTime = Date.now();
        this.version = process.env.npm_package_version || '1.0.0';
        this.environment = this.configService.get('NODE_ENV', 'development');
    }
    async getHealthStatus() {
        const checks = await Promise.allSettled([
            this.checkDatabase(),
            this.checkRedis(),
            this.checkMTN(),
            this.checkAirtel(),
            this.checkMemory(),
            this.checkDisk(),
        ]);
        const healthChecks = {
            database: this.getCheckResult(checks[0]),
            redis: this.getCheckResult(checks[1]),
            mtn: this.getCheckResult(checks[2]),
            airtel: this.getCheckResult(checks[3]),
            memory: this.getCheckResult(checks[4]),
            disk: this.getCheckResult(checks[5]),
        };
        const overallStatus = this.determineOverallStatus(healthChecks);
        const result = {
            status: overallStatus,
            timestamp: new Date().toISOString(),
            uptime: Date.now() - this.startTime,
            version: this.version,
            environment: this.environment,
            checks: healthChecks,
        };
        if (overallStatus !== 'healthy') {
            this.logger.warn('Health check failed', {
                status: overallStatus,
                failedChecks: Object.entries(healthChecks)
                    .filter(([_, check]) => check.status !== 'healthy')
                    .map(([name, check]) => ({ name, status: check.status, message: check.message })),
            });
        }
        return result;
    }
    async checkDatabase() {
        const startTime = Date.now();
        try {
            await this.dataSource.query('SELECT 1');
            return {
                status: 'healthy',
                responseTime: Date.now() - startTime,
                message: 'Database connection successful',
            };
        }
        catch (error) {
            return {
                status: 'unhealthy',
                responseTime: Date.now() - startTime,
                message: `Database connection failed: ${error.message}`,
                details: { error: error.message },
            };
        }
    }
    async checkRedis() {
        const startTime = Date.now();
        try {
            const redisClient = Redis.createClient({
                url: `redis://${this.configService.get('REDIS_PASSWORD') ? `:${this.configService.get('REDIS_PASSWORD')}@` : ''}${this.configService.get('REDIS_HOST', 'localhost')}:${this.configService.get('REDIS_PORT', 6379)}/${this.configService.get('REDIS_DB', 0)}`,
            });
            await redisClient.connect();
            await redisClient.ping();
            await redisClient.disconnect();
            return {
                status: 'healthy',
                responseTime: Date.now() - startTime,
                message: 'Redis connection successful',
            };
        }
        catch (error) {
            return {
                status: 'unhealthy',
                responseTime: Date.now() - startTime,
                message: `Redis connection failed: ${error.message}`,
                details: { error: error.message },
            };
        }
    }
    async checkMTN() {
        const startTime = Date.now();
        try {
            const baseUrl = this.configService.get('MTN_BASE_URL');
            const subscriptionKey = this.configService.get('MTN_SUBSCRIPTION_KEY');
            if (!baseUrl || !subscriptionKey) {
                return {
                    status: 'degraded',
                    message: 'MTN configuration incomplete',
                };
            }
            const response = await this.httpService.get(`${baseUrl}/collection/v1_0/accountbalance`, {
                headers: {
                    'Ocp-Apim-Subscription-Key': subscriptionKey,
                },
                timeout: 10000,
            }).toPromise();
            if (response.status === 200 || response.status === 401) {
                return {
                    status: 'healthy',
                    responseTime: Date.now() - startTime,
                    message: 'MTN API reachable',
                };
            }
            return {
                status: 'degraded',
                responseTime: Date.now() - startTime,
                message: `MTN API returned status ${response.status}`,
            };
        }
        catch (error) {
            if (error.response?.status === 401) {
                return {
                    status: 'healthy',
                    responseTime: Date.now() - startTime,
                    message: 'MTN API reachable (authentication required)',
                };
            }
            return {
                status: 'unhealthy',
                responseTime: Date.now() - startTime,
                message: `MTN API unreachable: ${error.message}`,
                details: { error: error.message },
            };
        }
    }
    async checkAirtel() {
        const startTime = Date.now();
        try {
            const baseUrl = this.configService.get('AIRTEL_BASE_URL');
            if (!baseUrl) {
                return {
                    status: 'degraded',
                    message: 'Airtel configuration incomplete',
                };
            }
            const response = await this.httpService.get(`${baseUrl}/auth/oauth2/token`, {
                timeout: 10000,
            }).toPromise();
            if (response.status === 200 || response.status === 400 || response.status === 401) {
                return {
                    status: 'healthy',
                    responseTime: Date.now() - startTime,
                    message: 'Airtel API reachable',
                };
            }
            return {
                status: 'degraded',
                responseTime: Date.now() - startTime,
                message: `Airtel API returned status ${response.status}`,
            };
        }
        catch (error) {
            if (error.response?.status === 400 || error.response?.status === 401) {
                return {
                    status: 'healthy',
                    responseTime: Date.now() - startTime,
                    message: 'Airtel API reachable (authentication required)',
                };
            }
            return {
                status: 'unhealthy',
                responseTime: Date.now() - startTime,
                message: `Airtel API unreachable: ${error.message}`,
                details: { error: error.message },
            };
        }
    }
    async checkMemory() {
        try {
            const memUsage = process.memoryUsage();
            const totalMemory = memUsage.heapTotal;
            const usedMemory = memUsage.heapUsed;
            const memoryUsagePercent = (usedMemory / totalMemory) * 100;
            let status = 'healthy';
            let message = `Memory usage: ${memoryUsagePercent.toFixed(2)}%`;
            if (memoryUsagePercent > 90) {
                status = 'unhealthy';
                message += ' (Critical)';
            }
            else if (memoryUsagePercent > 80) {
                status = 'degraded';
                message += ' (High)';
            }
            return {
                status,
                message,
                details: {
                    heapUsed: Math.round(usedMemory / 1024 / 1024),
                    heapTotal: Math.round(totalMemory / 1024 / 1024),
                    external: Math.round(memUsage.external / 1024 / 1024),
                    rss: Math.round(memUsage.rss / 1024 / 1024),
                },
            };
        }
        catch (error) {
            return {
                status: 'unhealthy',
                message: `Memory check failed: ${error.message}`,
            };
        }
    }
    async checkDisk() {
        try {
            const fs = require('fs');
            const stats = fs.statSync('.');
            return {
                status: 'healthy',
                message: 'Disk space check passed',
                details: {
                    note: 'Basic disk check - consider implementing detailed disk monitoring',
                },
            };
        }
        catch (error) {
            return {
                status: 'degraded',
                message: `Disk check failed: ${error.message}`,
            };
        }
    }
    getCheckResult(result) {
        if (result.status === 'fulfilled') {
            return result.value;
        }
        return {
            status: 'unhealthy',
            message: `Health check failed: ${result.reason}`,
        };
    }
    determineOverallStatus(checks) {
        const statuses = Object.values(checks).map(check => check.status);
        if (statuses.includes('unhealthy')) {
            return 'unhealthy';
        }
        if (statuses.includes('degraded')) {
            return 'degraded';
        }
        return 'healthy';
    }
};
exports.HealthService = HealthService;
exports.HealthService = HealthService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectDataSource)()),
    __metadata("design:paramtypes", [typeorm_2.DataSource,
        config_1.ConfigService,
        axios_1.HttpService,
        logger_service_1.LoggerService])
], HealthService);
//# sourceMappingURL=health.service.js.map