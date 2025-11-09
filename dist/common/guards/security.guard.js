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
exports.SecurityGuard = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const logger_service_1 = require("../services/logger.service");
const metrics_service_1 = require("../services/metrics.service");
let SecurityGuard = class SecurityGuard {
    constructor(configService, logger, metrics) {
        this.configService = configService;
        this.logger = logger;
        this.metrics = metrics;
        this.maxRequestSize = parseInt(configService.get('MAX_REQUEST_SIZE', '1048576'), 10);
        this.allowedOrigins = configService.get('CORS_ORIGIN', '*').split(',');
        this.blockedIPs = new Set(configService.get('BLOCKED_IPS', '').split(',').filter(Boolean));
        this.suspiciousPatterns = [
            /(<script|javascript:|vbscript:|onload=|onerror=)/i,
            /(union\s+select|drop\s+table|insert\s+into|delete\s+from)/i,
            /(\.\.\/|\.\.\\|\/etc\/passwd|\/proc\/)/i,
            /(\${|<%|<\?php)/i,
            /(eval\(|exec\(|system\(|shell_exec)/i,
        ];
    }
    async canActivate(context) {
        const request = context.switchToHttp().getRequest();
        const response = context.switchToHttp().getResponse();
        try {
            this.checkBlockedIP(request);
            this.checkRequestSize(request);
            this.checkSuspiciousPatterns(request);
            this.checkOrigin(request);
            this.checkAttackHeaders(request);
            await this.checkRateLimit(request);
            return true;
        }
        catch (error) {
            this.logSecurityEvent(request, error.message);
            throw error;
        }
    }
    checkBlockedIP(request) {
        const clientIP = this.getClientIP(request);
        if (this.blockedIPs.has(clientIP)) {
            this.metrics.incrementCounter('security.blocked_ip.total', 1, { ip: clientIP });
            throw new common_1.ForbiddenException('Access denied');
        }
    }
    checkRequestSize(request) {
        const contentLength = parseInt(request.get('Content-Length') || '0', 10);
        if (contentLength > this.maxRequestSize) {
            this.metrics.incrementCounter('security.oversized_request.total', 1);
            throw new common_1.BadRequestException('Request too large');
        }
    }
    checkSuspiciousPatterns(request) {
        const checkString = JSON.stringify({
            url: request.url,
            query: request.query,
            body: request.body,
            headers: this.sanitizeHeaders(request.headers),
        });
        for (const pattern of this.suspiciousPatterns) {
            if (pattern.test(checkString)) {
                this.metrics.incrementCounter('security.suspicious_pattern.total', 1, {
                    pattern: pattern.source,
                });
                throw new common_1.BadRequestException('Suspicious request detected');
            }
        }
    }
    checkOrigin(request) {
        const origin = request.get('Origin');
        if (origin && !this.allowedOrigins.includes('*')) {
            const isAllowed = this.allowedOrigins.some(allowedOrigin => {
                if (allowedOrigin.includes('*')) {
                    const pattern = allowedOrigin.replace(/\*/g, '.*');
                    return new RegExp(`^${pattern}$`).test(origin);
                }
                return allowedOrigin === origin;
            });
            if (!isAllowed) {
                this.metrics.incrementCounter('security.invalid_origin.total', 1, { origin });
                throw new common_1.ForbiddenException('Invalid origin');
            }
        }
    }
    checkAttackHeaders(request) {
        const headers = request.headers;
        const suspiciousHeaders = [
            'x-forwarded-host',
            'x-original-url',
            'x-rewrite-url',
        ];
        for (const header of suspiciousHeaders) {
            if (headers[header]) {
                this.metrics.incrementCounter('security.suspicious_header.total', 1, { header });
                this.logger.logSecurityEvent('Suspicious header detected', {
                    header,
                    value: headers[header],
                    ip: this.getClientIP(request),
                });
            }
        }
        for (const [name, value] of Object.entries(headers)) {
            if (typeof value === 'string' && value.length > 8192) {
                this.metrics.incrementCounter('security.oversized_header.total', 1, { header: name });
                throw new common_1.BadRequestException('Header too large');
            }
        }
    }
    async checkRateLimit(request) {
        const clientIP = this.getClientIP(request);
        const key = `rate_limit:${clientIP}`;
        this.metrics.incrementCounter('security.rate_limit_check.total', 1, { ip: clientIP });
    }
    getClientIP(request) {
        return (request.headers['x-forwarded-for']?.split(',')[0] ||
            request.headers['x-real-ip'] ||
            request.connection?.remoteAddress ||
            request.socket?.remoteAddress ||
            request.ip ||
            'unknown');
    }
    sanitizeHeaders(headers) {
        const sanitized = { ...headers };
        const sensitiveHeaders = [
            'authorization',
            'x-api-key',
            'cookie',
            'set-cookie',
        ];
        for (const header of sensitiveHeaders) {
            if (sanitized[header]) {
                sanitized[header] = '[REDACTED]';
            }
        }
        return sanitized;
    }
    logSecurityEvent(request, message) {
        this.logger.logSecurityEvent(message, {
            ip: this.getClientIP(request),
            userAgent: request.get('User-Agent'),
            url: request.url,
            method: request.method,
            headers: this.sanitizeHeaders(request.headers),
        });
        this.metrics.incrementCounter('security.events.total', 1, {
            type: 'blocked_request',
            ip: this.getClientIP(request),
        });
    }
};
exports.SecurityGuard = SecurityGuard;
exports.SecurityGuard = SecurityGuard = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [config_1.ConfigService,
        logger_service_1.LoggerService,
        metrics_service_1.MetricsService])
], SecurityGuard);
//# sourceMappingURL=security.guard.js.map