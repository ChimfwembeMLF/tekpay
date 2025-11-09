import { Injectable, LoggerService as NestLoggerService } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as fs from 'fs';
import * as path from 'path';

export enum LogLevel {
  ERROR = 0,
  WARN = 1,
  INFO = 2,
  DEBUG = 3,
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

@Injectable()
export class LoggerService implements NestLoggerService {
  private readonly logLevel: LogLevel;
  private readonly logFormat: 'json' | 'text';
  private readonly fileLoggingEnabled: boolean;
  private readonly logFilePath: string;
  private readonly environment: string;
  private readonly serviceName: string = 'tekpay-gateway';

  constructor(private readonly configService: ConfigService) {
    this.logLevel = this.getLogLevel(configService.get('LOG_LEVEL', 'info'));
    this.logFormat = configService.get('LOG_FORMAT', 'json') as 'json' | 'text';
    this.fileLoggingEnabled = configService.get('LOG_FILE_ENABLED', 'false') === 'true';
    this.logFilePath = configService.get('LOG_FILE_PATH', './logs/app.log');
    this.environment = configService.get('NODE_ENV', 'development');

    if (this.fileLoggingEnabled) {
      this.ensureLogDirectory();
    }
  }

  log(message: string, context?: LogContext): void {
    this.writeLog(LogLevel.INFO, message, context);
  }

  error(message: string, error?: Error, context?: LogContext): void {
    this.writeLog(LogLevel.ERROR, message, context, error);
  }

  warn(message: string, context?: LogContext): void {
    this.writeLog(LogLevel.WARN, message, context);
  }

  debug(message: string, context?: LogContext): void {
    this.writeLog(LogLevel.DEBUG, message, context);
  }

  verbose(message: string, context?: LogContext): void {
    this.writeLog(LogLevel.DEBUG, message, context);
  }

  // Specialized logging methods for business events
  logPaymentCreated(paymentId: string, amount: number, mno: string, consumerId: string): void {
    this.log('Payment created', {
      paymentId,
      amount,
      mno,
      consumerId,
      event: 'payment.created',
    });
  }

  logPaymentInitiated(paymentId: string, mnoReference: string, context?: LogContext): void {
    this.log('Payment initiated with MNO', {
      paymentId,
      mnoReference,
      event: 'payment.initiated',
      ...context,
    });
  }

  logPaymentCompleted(paymentId: string, amount: number, context?: LogContext): void {
    this.log('Payment completed successfully', {
      paymentId,
      amount,
      event: 'payment.completed',
      ...context,
    });
  }

  logPaymentFailed(paymentId: string, reason: string, context?: LogContext): void {
    this.error('Payment failed', new Error(reason), {
      paymentId,
      event: 'payment.failed',
      ...context,
    });
  }

  logApiCall(method: string, url: string, consumerId: string, statusCode: number, duration: number): void {
    this.log('API call', {
      method,
      url,
      consumerId,
      statusCode,
      duration,
      event: 'api.call',
    });
  }

  logWebhookReceived(provider: string, paymentId: string, status: string): void {
    this.log('Webhook received', {
      provider,
      paymentId,
      status,
      event: 'webhook.received',
    });
  }

  logSecurityEvent(event: string, details: LogContext): void {
    this.warn(`Security event: ${event}`, {
      ...details,
      event: 'security',
    });
  }

  private writeLog(level: LogLevel, message: string, context?: LogContext, error?: Error): void {
    if (level > this.logLevel) {
      return;
    }

    const logEntry: LogEntry = {
      timestamp: new Date().toISOString(),
      level: LogLevel[level].toLowerCase(),
      message,
      context,
      service: this.serviceName,
      environment: this.environment,
    };

    if (error) {
      logEntry.error = {
        name: error.name,
        message: error.message,
        stack: error.stack,
      };
    }

    const formattedLog = this.formatLog(logEntry);

    // Console output
    this.outputToConsole(level, formattedLog);

    // File output
    if (this.fileLoggingEnabled) {
      this.outputToFile(formattedLog);
    }
  }

  private formatLog(logEntry: LogEntry): string {
    if (this.logFormat === 'json') {
      return JSON.stringify(logEntry);
    }

    // Text format
    const timestamp = logEntry.timestamp;
    const level = logEntry.level.toUpperCase().padEnd(5);
    const message = logEntry.message;
    const context = logEntry.context ? ` | ${JSON.stringify(logEntry.context)}` : '';
    const error = logEntry.error ? ` | ERROR: ${logEntry.error.message}` : '';

    return `${timestamp} [${level}] ${message}${context}${error}`;
  }

  private outputToConsole(level: LogLevel, formattedLog: string): void {
    switch (level) {
      case LogLevel.ERROR:
        console.error(formattedLog);
        break;
      case LogLevel.WARN:
        console.warn(formattedLog);
        break;
      case LogLevel.DEBUG:
        console.debug(formattedLog);
        break;
      default:
        console.log(formattedLog);
    }
  }

  private outputToFile(formattedLog: string): void {
    try {
      fs.appendFileSync(this.logFilePath, formattedLog + '\n');
    } catch (error) {
      console.error('Failed to write to log file:', error);
    }
  }

  private ensureLogDirectory(): void {
    const logDir = path.dirname(this.logFilePath);
    if (!fs.existsSync(logDir)) {
      fs.mkdirSync(logDir, { recursive: true });
    }
  }

  private getLogLevel(levelString: string): LogLevel {
    switch (levelString.toLowerCase()) {
      case 'error':
        return LogLevel.ERROR;
      case 'warn':
        return LogLevel.WARN;
      case 'info':
        return LogLevel.INFO;
      case 'debug':
        return LogLevel.DEBUG;
      default:
        return LogLevel.INFO;
    }
  }
}
