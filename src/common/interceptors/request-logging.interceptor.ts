import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import { LoggerService } from '../services/logger.service';
import { MetricsService } from '../services/metrics.service';
import { v4 as uuidv4 } from 'uuid';

@Injectable()
export class RequestLoggingInterceptor implements NestInterceptor {
  constructor(
    private readonly logger: LoggerService,
    private readonly metrics: MetricsService,
  ) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const request = context.switchToHttp().getRequest();
    const response = context.switchToHttp().getResponse();
    const startTime = Date.now();

    // Add request ID for tracing
    request.id = uuidv4();

    // Extract request information
    const method = request.method;
    const url = request.url;
    const userAgent = request.get('User-Agent') || '';
    const ipAddress = request.ip || request.connection.remoteAddress;
    const contentLength = request.get('Content-Length') || 0;
    const consumerId = request.user?.consumerId;
    const apiKey = request.get('X-API-Key');

    // Log request start
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

    return next.handle().pipe(
      tap({
        next: (data) => {
          const duration = Date.now() - startTime;
          const statusCode = response.statusCode;
          const contentLength = response.get('Content-Length') || 0;

          // Log successful request
          this.logger.logApiCall(method, url, consumerId, statusCode, duration);

          // Record metrics
          this.metrics.recordApiCall(
            method,
            this.sanitizeEndpoint(request.route?.path || url),
            statusCode,
            duration
          );

          // Log response details
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

          // Record business metrics
          this.recordBusinessMetrics(request, response, data);
        },
        error: (error) => {
          const duration = Date.now() - startTime;
          
          // Error logging is handled by ErrorHandlingInterceptor
          // Just record the duration here
          this.logger.debug(`Request failed: ${method} ${url}`, {
            requestId: request.id,
            method,
            url,
            duration,
            error: error.message,
            event: 'request.failed',
          });
        },
      })
    );
  }

  private sanitizeEndpoint(path: string): string {
    // Replace dynamic segments with placeholders for better metric grouping
    return path
      .replace(/\/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/gi, '/:id')
      .replace(/\/\d+/g, '/:id')
      .replace(/\/[a-zA-Z0-9_-]{20,}/g, '/:token');
  }

  private recordBusinessMetrics(request: any, response: any, data: any): void {
    const endpoint = request.route?.path || request.url;
    const method = request.method;

    try {
      // Record payment-specific metrics
      if (endpoint.includes('/payments') && method === 'POST') {
        if (data && data.amount && data.mno) {
          this.metrics.recordPaymentCreated(data.mno, data.amount);
        }
      }

      // Record webhook metrics
      if (endpoint.includes('/webhooks')) {
        const provider = this.extractProviderFromPath(endpoint);
        if (provider) {
          this.metrics.recordWebhookReceived(provider, 'received');
        }
      }

      // Record admin dashboard metrics
      if (endpoint.includes('/admin')) {
        this.metrics.incrementCounter('admin.requests.total', 1, {
          endpoint: this.sanitizeEndpoint(endpoint),
          method,
        });
      }

      // Record authentication metrics
      if (endpoint.includes('/auth')) {
        this.metrics.incrementCounter('auth.requests.total', 1, {
          endpoint: this.sanitizeEndpoint(endpoint),
          method,
          success: response.statusCode < 400 ? 'true' : 'false',
        });
      }

      // Record billing metrics
      if (endpoint.includes('/billing')) {
        this.metrics.incrementCounter('billing.requests.total', 1, {
          endpoint: this.sanitizeEndpoint(endpoint),
          method,
        });
      }

    } catch (error) {
      // Don't let metric recording errors affect the main request
      this.logger.debug('Failed to record business metrics', { error: error.message });
    }
  }

  private extractProviderFromPath(path: string): string | null {
    if (path.includes('mtn')) return 'MTN';
    if (path.includes('airtel')) return 'AIRTEL';
    return null;
  }
}
