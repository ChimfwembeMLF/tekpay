"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const testing_1 = require("@nestjs/testing");
const config_1 = require("@nestjs/config");
const logger_service_1 = require("./logger.service");
describe('LoggerService', () => {
    let service;
    let configService;
    beforeEach(async () => {
        const module = await testing_1.Test.createTestingModule({
            providers: [
                logger_service_1.LoggerService,
                {
                    provide: config_1.ConfigService,
                    useValue: {
                        get: jest.fn((key, defaultValue) => {
                            const config = {
                                LOG_LEVEL: 'info',
                                LOG_FORMAT: 'json',
                                LOG_FILE_ENABLED: 'false',
                                LOG_FILE_PATH: './logs/app.log',
                                NODE_ENV: 'test',
                            };
                            return config[key] || defaultValue;
                        }),
                    },
                },
            ],
        }).compile();
        service = module.get(logger_service_1.LoggerService);
        configService = module.get(config_1.ConfigService);
    });
    it('should be defined', () => {
        expect(service).toBeDefined();
    });
    it('should log messages', () => {
        const consoleSpy = jest.spyOn(console, 'log').mockImplementation();
        service.log('Test message');
        expect(consoleSpy).toHaveBeenCalled();
        consoleSpy.mockRestore();
    });
    it('should log errors', () => {
        const consoleSpy = jest.spyOn(console, 'error').mockImplementation();
        service.error('Test error', new Error('Test error'));
        expect(consoleSpy).toHaveBeenCalled();
        consoleSpy.mockRestore();
    });
    it('should log payment events', () => {
        const consoleSpy = jest.spyOn(console, 'log').mockImplementation();
        service.logPaymentCreated('payment-123', 1000, 'MTN', 'consumer-123');
        expect(consoleSpy).toHaveBeenCalled();
        consoleSpy.mockRestore();
    });
    it('should log API calls', () => {
        const consoleSpy = jest.spyOn(console, 'log').mockImplementation();
        service.logApiCall('POST', '/api/v1/payments', 'consumer-123', 201, 150);
        expect(consoleSpy).toHaveBeenCalled();
        consoleSpy.mockRestore();
    });
    it('should log webhook events', () => {
        const consoleSpy = jest.spyOn(console, 'log').mockImplementation();
        service.logWebhookReceived('MTN', 'payment-123', 'completed');
        expect(consoleSpy).toHaveBeenCalled();
        consoleSpy.mockRestore();
    });
    it('should log security events', () => {
        const consoleSpy = jest.spyOn(console, 'warn').mockImplementation();
        service.logSecurityEvent('Suspicious activity', { ip: '192.168.1.1' });
        expect(consoleSpy).toHaveBeenCalled();
        consoleSpy.mockRestore();
    });
});
//# sourceMappingURL=logger.service.spec.js.map