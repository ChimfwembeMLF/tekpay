import { NestInterceptor, ExecutionContext, CallHandler } from '@nestjs/common';
import { Observable } from 'rxjs';
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
export declare class ErrorHandlingInterceptor implements NestInterceptor {
    private readonly logger;
    private readonly metrics;
    constructor(logger: LoggerService, metrics: MetricsService);
    intercept(context: ExecutionContext, next: CallHandler): Observable<any>;
    private handleError;
    private sanitizeEndpoint;
}
