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
exports.ErrorHandlingInterceptor = void 0;
const common_1 = require("@nestjs/common");
const rxjs_1 = require("rxjs");
const operators_1 = require("rxjs/operators");
const logger_service_1 = require("../services/logger.service");
const metrics_service_1 = require("../services/metrics.service");
let ErrorHandlingInterceptor = class ErrorHandlingInterceptor {
    constructor(logger, metrics) {
        this.logger = logger;
        this.metrics = metrics;
    }
    intercept(context, next) {
        const request = context.switchToHttp().getRequest();
        const response = context.switchToHttp().getResponse();
        const startTime = Date.now();
        return next.handle().pipe((0, operators_1.catchError)((error) => {
            const duration = Date.now() - startTime;
            const errorResponse = this.handleError(error, request, response);
            this.logger.error(`Request failed: ${request.method} ${request.url}`, error, {
                requestId: request.id,
                method: request.method,
                url: request.url,
                statusCode: errorResponse.statusCode,
                duration,
                userAgent: request.get('User-Agent'),
                ipAddress: request.ip,
                consumerId: request.user?.consumerId,
            });
            this.metrics.recordApiCall(request.method, this.sanitizeEndpoint(request.route?.path || request.url), errorResponse.statusCode, duration);
            this.metrics.incrementCounter('api.errors.total', 1, {
                method: request.method,
                endpoint: this.sanitizeEndpoint(request.route?.path || request.url),
                status: errorResponse.statusCode.toString(),
                errorType: error.constructor.name,
            });
            return (0, rxjs_1.throwError)(() => new common_1.HttpException(errorResponse, errorResponse.statusCode));
        }));
    }
    handleError(error, request, response) {
        const timestamp = new Date().toISOString();
        const path = request.url;
        const requestId = request.id;
        if (error instanceof common_1.HttpException) {
            const status = error.getStatus();
            const errorResponse = error.getResponse();
            return {
                statusCode: status,
                message: typeof errorResponse === 'string' ? errorResponse : errorResponse.message,
                error: typeof errorResponse === 'string' ? error.name : errorResponse.error || error.name,
                timestamp,
                path,
                requestId,
                details: typeof errorResponse === 'object' ? errorResponse : undefined,
            };
        }
        if (error.name === 'ValidationError' || error.name === 'ValidatorError') {
            return {
                statusCode: common_1.HttpStatus.BAD_REQUEST,
                message: 'Validation failed',
                error: 'Bad Request',
                timestamp,
                path,
                requestId,
                details: error.details || error.message,
            };
        }
        if (error.name === 'QueryFailedError' || error.code?.startsWith('23')) {
            let message = 'Database operation failed';
            let statusCode = common_1.HttpStatus.INTERNAL_SERVER_ERROR;
            if (error.code === '23505') {
                message = 'Resource already exists';
                statusCode = common_1.HttpStatus.CONFLICT;
            }
            else if (error.code === '23503') {
                message = 'Referenced resource not found';
                statusCode = common_1.HttpStatus.BAD_REQUEST;
            }
            else if (error.code === '23502') {
                message = 'Required field missing';
                statusCode = common_1.HttpStatus.BAD_REQUEST;
            }
            return {
                statusCode,
                message,
                error: 'Database Error',
                timestamp,
                path,
                requestId,
                details: process.env.NODE_ENV === 'development' ? error.detail : undefined,
            };
        }
        if (error.name === 'JsonWebTokenError' || error.name === 'TokenExpiredError') {
            return {
                statusCode: common_1.HttpStatus.UNAUTHORIZED,
                message: 'Invalid or expired token',
                error: 'Unauthorized',
                timestamp,
                path,
                requestId,
            };
        }
        if (error.name === 'TimeoutError' || error.code === 'ETIMEDOUT') {
            return {
                statusCode: common_1.HttpStatus.REQUEST_TIMEOUT,
                message: 'Request timeout',
                error: 'Request Timeout',
                timestamp,
                path,
                requestId,
            };
        }
        if (error.code === 'ECONNREFUSED' || error.code === 'ENOTFOUND') {
            return {
                statusCode: common_1.HttpStatus.SERVICE_UNAVAILABLE,
                message: 'External service unavailable',
                error: 'Service Unavailable',
                timestamp,
                path,
                requestId,
            };
        }
        if (error.name === 'ThrottlerException') {
            return {
                statusCode: common_1.HttpStatus.TOO_MANY_REQUESTS,
                message: 'Too many requests',
                error: 'Too Many Requests',
                timestamp,
                path,
                requestId,
            };
        }
        if (error.name === 'PaymentError') {
            return {
                statusCode: common_1.HttpStatus.BAD_REQUEST,
                message: error.message || 'Payment processing failed',
                error: 'Payment Error',
                timestamp,
                path,
                requestId,
                details: {
                    paymentId: error.paymentId,
                    mnoReference: error.mnoReference,
                    reason: error.reason,
                },
            };
        }
        if (error.name === 'MNOError' || error.isMNOError) {
            return {
                statusCode: common_1.HttpStatus.BAD_GATEWAY,
                message: error.message || 'Mobile network operator error',
                error: 'MNO Error',
                timestamp,
                path,
                requestId,
                details: {
                    provider: error.provider,
                    mnoCode: error.mnoCode,
                    mnoMessage: error.mnoMessage,
                },
            };
        }
        const isProduction = process.env.NODE_ENV === 'production';
        return {
            statusCode: common_1.HttpStatus.INTERNAL_SERVER_ERROR,
            message: isProduction ? 'Internal server error' : error.message,
            error: 'Internal Server Error',
            timestamp,
            path,
            requestId,
            details: isProduction ? undefined : {
                stack: error.stack,
                name: error.name,
            },
        };
    }
    sanitizeEndpoint(path) {
        return path
            .replace(/\/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/gi, '/:id')
            .replace(/\/\d+/g, '/:id')
            .replace(/\/[a-zA-Z0-9_-]{20,}/g, '/:token');
    }
};
exports.ErrorHandlingInterceptor = ErrorHandlingInterceptor;
exports.ErrorHandlingInterceptor = ErrorHandlingInterceptor = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [logger_service_1.LoggerService,
        metrics_service_1.MetricsService])
], ErrorHandlingInterceptor);
//# sourceMappingURL=error-handling.interceptor.js.map