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
exports.RequestLoggingInterceptor = void 0;
const common_1 = require("@nestjs/common");
const operators_1 = require("rxjs/operators");
const logger_service_1 = require("../services/logger.service");
const metrics_service_1 = require("../services/metrics.service");
const uuid_1 = require("uuid");
let RequestLoggingInterceptor = class RequestLoggingInterceptor {
    constructor(logger, metrics) {
        this.logger = logger;
        this.metrics = metrics;
    }
    intercept(context, next) {
        const request = context.switchToHttp().getRequest();
        const response = context.switchToHttp().getResponse();
        const startTime = Date.now();
        request.id = (0, uuid_1.v4)();
        const method = request.method;
        const url = request.url;
        const userAgent = request.get('User-Agent') || '';
        const ipAddress = request.ip || request.connection.remoteAddress;
        const contentLength = request.get('Content-Length') || 0;
        const consumerId = request.user?.consumerId;
        const apiKey = request.get('X-API-Key');
        this.logger.log(`Request started: ${method} ${url}`, {
            requestId: request.id,
            method,
            url,
            userAgent,
            ipAddress,
            contentLength: parseInt(contentLength, 10),
            consumerId,
            hasApiKey: !!apiKey,
            event: 'request.started',
        });
        return next.handle().pipe((0, operators_1.tap)({
            next: (data) => {
                const duration = Date.now() - startTime;
                const statusCode = response.statusCode;
                const contentLength = response.get('Content-Length') || 0;
                this.logger.logApiCall(method, url, consumerId, statusCode, duration);
                this.metrics.recordApiCall(method, this.sanitizeEndpoint(request.route?.path || url), statusCode, duration);
                this.logger.log(`Request completed: ${method} ${url}`, {
                    requestId: request.id,
                    method,
                    url,
                    statusCode,
                    duration,
                    responseSize: parseInt(contentLength, 10),
                    consumerId,
                    event: 'request.completed',
                });
                this.recordBusinessMetrics(request, response, data);
            },
            error: (error) => {
                const duration = Date.now() - startTime;
                this.logger.debug(`Request failed: ${method} ${url}`, {
                    requestId: request.id,
                    method,
                    url,
                    duration,
                    error: error.message,
                    event: 'request.failed',
                });
            },
        }));
    }
    sanitizeEndpoint(path) {
        return path
            .replace(/\/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/gi, '/:id')
            .replace(/\/\d+/g, '/:id')
            .replace(/\/[a-zA-Z0-9_-]{20,}/g, '/:token');
    }
    recordBusinessMetrics(request, response, data) {
        const endpoint = request.route?.path || request.url;
        const method = request.method;
        try {
            if (endpoint.includes('/payments') && method === 'POST') {
                if (data && data.amount && data.mno) {
                    this.metrics.recordPaymentCreated(data.mno, data.amount);
                }
            }
            if (endpoint.includes('/webhooks')) {
                const provider = this.extractProviderFromPath(endpoint);
                if (provider) {
                    this.metrics.recordWebhookReceived(provider, 'received');
                }
            }
            if (endpoint.includes('/admin')) {
                this.metrics.incrementCounter('admin.requests.total', 1, {
                    endpoint: this.sanitizeEndpoint(endpoint),
                    method,
                });
            }
            if (endpoint.includes('/auth')) {
                this.metrics.incrementCounter('auth.requests.total', 1, {
                    endpoint: this.sanitizeEndpoint(endpoint),
                    method,
                    success: response.statusCode < 400 ? 'true' : 'false',
                });
            }
            if (endpoint.includes('/billing')) {
                this.metrics.incrementCounter('billing.requests.total', 1, {
                    endpoint: this.sanitizeEndpoint(endpoint),
                    method,
                });
            }
        }
        catch (error) {
            this.logger.debug('Failed to record business metrics', { error: error.message });
        }
    }
    extractProviderFromPath(path) {
        if (path.includes('mtn'))
            return 'MTN';
        if (path.includes('airtel'))
            return 'AIRTEL';
        return null;
    }
};
exports.RequestLoggingInterceptor = RequestLoggingInterceptor;
exports.RequestLoggingInterceptor = RequestLoggingInterceptor = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [logger_service_1.LoggerService,
        metrics_service_1.MetricsService])
], RequestLoggingInterceptor);
//# sourceMappingURL=request-logging.interceptor.js.map