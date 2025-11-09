import {
  Injectable,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { LoggerService } from '../services/logger.service';
import { MetricsService } from '../services/metrics.service';

@Injectable()
export class SecurityGuard implements CanActivate {
  private readonly maxRequestSize: number;
  private readonly allowedOrigins: string[];
  private readonly blockedIPs: Set<string>;
  private readonly suspiciousPatterns: RegExp[];

  constructor(
    private readonly configService: ConfigService,
    private readonly logger: LoggerService,
    private readonly metrics: MetricsService,
  ) {
    this.maxRequestSize = parseInt(configService.get('MAX_REQUEST_SIZE', '1048576'), 10); // 1MB
    this.allowedOrigins = configService.get('CORS_ORIGIN', '*').split(',');
    this.blockedIPs = new Set(configService.get('BLOCKED_IPS', '').split(',').filter(Boolean));
    
    // Common attack patterns
    this.suspiciousPatterns = [
      /(<script|javascript:|vbscript:|onload=|onerror=)/i, // XSS
      /(union\s+select|drop\s+table|insert\s+into|delete\s+from)/i, // SQL injection
      /(\.\.\/|\.\.\\|\/etc\/passwd|\/proc\/)/i, // Path traversal
      /(\${|<%|<\?php)/i, // Template injection
      /(eval\(|exec\(|system\(|shell_exec)/i, // Code injection
    ];
  }

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const response = context.switchToHttp().getResponse();

    try {
      // Check IP blocking
      this.checkBlockedIP(request);

      // Check request size
      this.checkRequestSize(request);

      // Check for suspicious patterns
      this.checkSuspiciousPatterns(request);

      // Check origin (for CORS)
      this.checkOrigin(request);

      // Check for common attack headers
      this.checkAttackHeaders(request);

      // Rate limiting check (basic implementation)
      await this.checkRateLimit(request);

      return true;
    } catch (error) {
      this.logSecurityEvent(request, error.message);
      throw error;
    }
  }

  private checkBlockedIP(request: any): void {
    const clientIP = this.getClientIP(request);
    
    if (this.blockedIPs.has(clientIP)) {
      this.metrics.incrementCounter('security.blocked_ip.total', 1, { ip: clientIP });
      throw new ForbiddenException('Access denied');
    }
  }

  private checkRequestSize(request: any): void {
    const contentLength = parseInt(request.get('Content-Length') || '0', 10);
    
    if (contentLength > this.maxRequestSize) {
      this.metrics.incrementCounter('security.oversized_request.total', 1);
      throw new BadRequestException('Request too large');
    }
  }

  private checkSuspiciousPatterns(request: any): void {
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
        throw new BadRequestException('Suspicious request detected');
      }
    }
  }

  private checkOrigin(request: any): void {
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
        throw new ForbiddenException('Invalid origin');
      }
    }
  }

  private checkAttackHeaders(request: any): void {
    const headers = request.headers;
    
    // Check for common attack headers
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

    // Check for excessively long headers
    for (const [name, value] of Object.entries(headers)) {
      if (typeof value === 'string' && value.length > 8192) {
        this.metrics.incrementCounter('security.oversized_header.total', 1, { header: name });
        throw new BadRequestException('Header too large');
      }
    }
  }

  private async checkRateLimit(request: any): Promise<void> {
    // This is a basic implementation. In production, you might want to use Redis
    // or a more sophisticated rate limiting library like @nestjs/throttler
    
    const clientIP = this.getClientIP(request);
    const key = `rate_limit:${clientIP}`;
    
    // For now, just log rate limiting attempts
    this.metrics.incrementCounter('security.rate_limit_check.total', 1, { ip: clientIP });
  }

  private getClientIP(request: any): string {
    return (
      request.headers['x-forwarded-for']?.split(',')[0] ||
      request.headers['x-real-ip'] ||
      request.connection?.remoteAddress ||
      request.socket?.remoteAddress ||
      request.ip ||
      'unknown'
    );
  }

  private sanitizeHeaders(headers: any): any {
    const sanitized = { ...headers };
    
    // Remove sensitive headers from logging
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

  private logSecurityEvent(request: any, message: string): void {
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
}
