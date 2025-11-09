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
exports.LoggerService = exports.LogLevel = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const fs = require("fs");
const path = require("path");
var LogLevel;
(function (LogLevel) {
    LogLevel[LogLevel["ERROR"] = 0] = "ERROR";
    LogLevel[LogLevel["WARN"] = 1] = "WARN";
    LogLevel[LogLevel["INFO"] = 2] = "INFO";
    LogLevel[LogLevel["DEBUG"] = 3] = "DEBUG";
})(LogLevel || (exports.LogLevel = LogLevel = {}));
let LoggerService = class LoggerService {
    constructor(configService) {
        this.configService = configService;
        this.serviceName = 'tekpay-gateway';
        this.logLevel = this.getLogLevel(configService.get('LOG_LEVEL', 'info'));
        this.logFormat = configService.get('LOG_FORMAT', 'json');
        this.fileLoggingEnabled = configService.get('LOG_FILE_ENABLED', 'false') === 'true';
        this.logFilePath = configService.get('LOG_FILE_PATH', './logs/app.log');
        this.environment = configService.get('NODE_ENV', 'development');
        if (this.fileLoggingEnabled) {
            this.ensureLogDirectory();
        }
    }
    log(message, context) {
        this.writeLog(LogLevel.INFO, message, context);
    }
    error(message, error, context) {
        this.writeLog(LogLevel.ERROR, message, context, error);
    }
    warn(message, context) {
        this.writeLog(LogLevel.WARN, message, context);
    }
    debug(message, context) {
        this.writeLog(LogLevel.DEBUG, message, context);
    }
    verbose(message, context) {
        this.writeLog(LogLevel.DEBUG, message, context);
    }
    logPaymentCreated(paymentId, amount, mno, consumerId) {
        this.log('Payment created', {
            paymentId,
            amount,
            mno,
            consumerId,
            event: 'payment.created',
        });
    }
    logPaymentInitiated(paymentId, mnoReference, context) {
        this.log('Payment initiated with MNO', {
            paymentId,
            mnoReference,
            event: 'payment.initiated',
            ...context,
        });
    }
    logPaymentCompleted(paymentId, amount, context) {
        this.log('Payment completed successfully', {
            paymentId,
            amount,
            event: 'payment.completed',
            ...context,
        });
    }
    logPaymentFailed(paymentId, reason, context) {
        this.error('Payment failed', new Error(reason), {
            paymentId,
            event: 'payment.failed',
            ...context,
        });
    }
    logApiCall(method, url, consumerId, statusCode, duration) {
        this.log('API call', {
            method,
            url,
            consumerId,
            statusCode,
            duration,
            event: 'api.call',
        });
    }
    logWebhookReceived(provider, paymentId, status) {
        this.log('Webhook received', {
            provider,
            paymentId,
            status,
            event: 'webhook.received',
        });
    }
    logSecurityEvent(event, details) {
        this.warn(`Security event: ${event}`, {
            ...details,
            event: 'security',
        });
    }
    writeLog(level, message, context, error) {
        if (level > this.logLevel) {
            return;
        }
        const logEntry = {
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
        this.outputToConsole(level, formattedLog);
        if (this.fileLoggingEnabled) {
            this.outputToFile(formattedLog);
        }
    }
    formatLog(logEntry) {
        if (this.logFormat === 'json') {
            return JSON.stringify(logEntry);
        }
        const timestamp = logEntry.timestamp;
        const level = logEntry.level.toUpperCase().padEnd(5);
        const message = logEntry.message;
        const context = logEntry.context ? ` | ${JSON.stringify(logEntry.context)}` : '';
        const error = logEntry.error ? ` | ERROR: ${logEntry.error.message}` : '';
        return `${timestamp} [${level}] ${message}${context}${error}`;
    }
    outputToConsole(level, formattedLog) {
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
    outputToFile(formattedLog) {
        try {
            fs.appendFileSync(this.logFilePath, formattedLog + '\n');
        }
        catch (error) {
            console.error('Failed to write to log file:', error);
        }
    }
    ensureLogDirectory() {
        const logDir = path.dirname(this.logFilePath);
        if (!fs.existsSync(logDir)) {
            fs.mkdirSync(logDir, { recursive: true });
        }
    }
    getLogLevel(levelString) {
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
};
exports.LoggerService = LoggerService;
exports.LoggerService = LoggerService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [config_1.ConfigService])
], LoggerService);
//# sourceMappingURL=logger.service.js.map