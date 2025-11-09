import { LoggerService as NestLoggerService } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
export declare enum LogLevel {
    ERROR = 0,
    WARN = 1,
    INFO = 2,
    DEBUG = 3
}
export interface LogContext {
    userId?: string;
    consumerId?: string;
    paymentId?: string;
    transactionId?: string;
    requestId?: string;
    ipAddress?: string;
    userAgent?: string;
    method?: string;
    url?: string;
    statusCode?: number;
    duration?: number;
    [key: string]: any;
}
export interface LogEntry {
    timestamp: string;
    level: string;
    message: string;
    context?: LogContext;
    error?: {
        name: string;
        message: string;
        stack?: string;
    };
    service: string;
    environment: string;
}
export declare class LoggerService implements NestLoggerService {
    private readonly configService;
    private readonly logLevel;
    private readonly logFormat;
    private readonly fileLoggingEnabled;
    private readonly logFilePath;
    private readonly environment;
    private readonly serviceName;
    constructor(configService: ConfigService);
    log(message: string, context?: LogContext): void;
    error(message: string, error?: Error, context?: LogContext): void;
    warn(message: string, context?: LogContext): void;
    debug(message: string, context?: LogContext): void;
    verbose(message: string, context?: LogContext): void;
    logPaymentCreated(paymentId: string, amount: number, mno: string, consumerId: string): void;
    logPaymentInitiated(paymentId: string, mnoReference: string, context?: LogContext): void;
    logPaymentCompleted(paymentId: string, amount: number, context?: LogContext): void;
    logPaymentFailed(paymentId: string, reason: string, context?: LogContext): void;
    logApiCall(method: string, url: string, consumerId: string, statusCode: number, duration: number): void;
    logWebhookReceived(provider: string, paymentId: string, status: string): void;
    logSecurityEvent(event: string, details: LogContext): void;
    private writeLog;
    private formatLog;
    private outputToConsole;
    private outputToFile;
    private ensureLogDirectory;
    private getLogLevel;
}
