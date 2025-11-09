import { CanActivate, ExecutionContext } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { LoggerService } from '../services/logger.service';
import { MetricsService } from '../services/metrics.service';
export declare class SecurityGuard implements CanActivate {
    private readonly configService;
    private readonly logger;
    private readonly metrics;
    private readonly maxRequestSize;
    private readonly allowedOrigins;
    private readonly blockedIPs;
    private readonly suspiciousPatterns;
    constructor(configService: ConfigService, logger: LoggerService, metrics: MetricsService);
    canActivate(context: ExecutionContext): Promise<boolean>;
    private checkBlockedIP;
    private checkRequestSize;
    private checkSuspiciousPatterns;
    private checkOrigin;
    private checkAttackHeaders;
    private checkRateLimit;
    private getClientIP;
    private sanitizeHeaders;
    private logSecurityEvent;
}
