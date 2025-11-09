import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { Observable, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { LoggerService } from '../services/logger.service';
import { MetricsService } from '../services/metrics.service';

export interface ErrorResponse {
  statusCode: number;
  message: string;
  error: string;
  timestamp: string;
  path: string;
  requestId?: string;
  details?: any;
}

@Injectable()
export class ErrorHandlingInterceptor implements NestInterceptor {
  constructor(
    private readonly logger: LoggerService,
    private readonly metrics: MetricsService,
  ) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const request = context.switchToHttp().getRequest();
    const response = context.switchToHttp().getResponse();
    const startTime = Date.now();

    return next.handle().pipe(
      catchError((error) => {
        const duration = Date.now() - startTime;
        const errorResponse = this.handleError(error, request, response);
        
        // Log the error
        this.logger.error(
          `Request failed: ${request.method} ${request.url}`,
          error,
          {
            requestId: request.id,
            method: request.method,
            url: request.url,
            statusCode: errorResponse.statusCode,
            duration,
            userAgent: request.get('User-Agent'),
            ipAddress: request.ip,
            consumerId: request.user?.consumerId,
          }
        );

        // Record metrics
        this.metrics.recordApiCall(
          request.method,
          this.sanitizeEndpoint(request.route?.path || request.url),
          errorResponse.statusCode,
          duration
        );

        this.metrics.incrementCounter('api.errors.total', 1, {
          method: request.method,
          endpoint: this.sanitizeEndpoint(request.route?.path || request.url),
          status: errorResponse.statusCode.toString(),
          errorType: error.constructor.name,
        });

        return throwError(() => new HttpException(errorResponse, errorResponse.statusCode));
      })
    );
  }

  private handleError(error: any, request: any, response: any): ErrorResponse {
    const timestamp = new Date().toISOString();
    const path = request.url;
    const requestId = request.id;

    // Handle known HTTP exceptions
    if (error instanceof HttpException) {
      const status = error.getStatus();
      const errorResponse = error.getResponse();

      return {
        statusCode: status,
        message: typeof errorResponse === 'string' ? errorResponse : (errorResponse as any).message,
        error: typeof errorResponse === 'string' ? error.name : (errorResponse as any).error || error.name,
        timestamp,
        path,
        requestId,
        details: typeof errorResponse === 'object' ? errorResponse : undefined,
      };
    }

    // Handle validation errors
    if (error.name === 'ValidationError' || error.name === 'ValidatorError') {
      return {
        statusCode: HttpStatus.BAD_REQUEST,
        message: 'Validation failed',
        error: 'Bad Request',
        timestamp,
        path,
        requestId,
        details: error.details || error.message,
      };
    }

    // Handle database errors
    if (error.name === 'QueryFailedError' || error.code?.startsWith('23')) {
      let message = 'Database operation failed';
      let statusCode = HttpStatus.INTERNAL_SERVER_ERROR;

      // Handle specific database constraint violations
      if (error.code === '23505') { // Unique constraint violation
        message = 'Resource already exists';
        statusCode = HttpStatus.CONFLICT;
      } else if (error.code === '23503') { // Foreign key constraint violation
        message = 'Referenced resource not found';
        statusCode = HttpStatus.BAD_REQUEST;
      } else if (error.code === '23502') { // Not null constraint violation
        message = 'Required field missing';
        statusCode = HttpStatus.BAD_REQUEST;
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

    // Handle JWT errors
    if (error.name === 'JsonWebTokenError' || error.name === 'TokenExpiredError') {
      return {
        statusCode: HttpStatus.UNAUTHORIZED,
        message: 'Invalid or expired token',
        error: 'Unauthorized',
        timestamp,
        path,
        requestId,
      };
    }

    // Handle timeout errors
    if (error.name === 'TimeoutError' || error.code === 'ETIMEDOUT') {
      return {
        statusCode: HttpStatus.REQUEST_TIMEOUT,
        message: 'Request timeout',
        error: 'Request Timeout',
        timestamp,
        path,
        requestId,
      };
    }

    // Handle network errors
    if (error.code === 'ECONNREFUSED' || error.code === 'ENOTFOUND') {
      return {
        statusCode: HttpStatus.SERVICE_UNAVAILABLE,
        message: 'External service unavailable',
        error: 'Service Unavailable',
        timestamp,
        path,
        requestId,
      };
    }

    // Handle rate limiting errors
    if (error.name === 'ThrottlerException') {
      return {
        statusCode: HttpStatus.TOO_MANY_REQUESTS,
        message: 'Too many requests',
        error: 'Too Many Requests',
        timestamp,
        path,
        requestId,
      };
    }

    // Handle payment-specific errors
    if (error.name === 'PaymentError') {
      return {
        statusCode: HttpStatus.BAD_REQUEST,
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

    // Handle MNO API errors
    if (error.name === 'MNOError' || error.isMNOError) {
      return {
        statusCode: HttpStatus.BAD_GATEWAY,
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

    // Handle generic errors
    const isProduction = process.env.NODE_ENV === 'production';
    
    return {
      statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
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

  private sanitizeEndpoint(path: string): string {
    // Replace dynamic segments with placeholders for better metric grouping
    return path
      .replace(/\/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/gi, '/:id')
      .replace(/\/\d+/g, '/:id')
      .replace(/\/[a-zA-Z0-9_-]{20,}/g, '/:token');
  }
}
