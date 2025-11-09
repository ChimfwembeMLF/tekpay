import { ConfigService } from '@nestjs/config';
import { LoggerService } from './logger.service';
import { MetricsService } from './metrics.service';
export interface PerformanceProfile {
    name: string;
    startTime: number;
    endTime?: number;
    duration?: number;
    metadata?: Record<string, any>;
}
export interface CacheEntry<T> {
    data: T;
    timestamp: number;
    ttl: number;
}
export declare class PerformanceService {
    private readonly configService;
    private readonly logger;
    private readonly metrics;
    private readonly profiles;
    private readonly cache;
    private readonly performanceEnabled;
    private readonly cacheEnabled;
    private readonly defaultCacheTTL;
    constructor(configService: ConfigService, logger: LoggerService, metrics: MetricsService);
    startProfile(name: string, metadata?: Record<string, any>): string;
    endProfile(profileId: string): PerformanceProfile | null;
    timeFunction<T>(name: string, fn: () => Promise<T>, metadata?: Record<string, any>): Promise<T>;
    set<T>(key: string, data: T, ttl?: number): void;
    get<T>(key: string): T | null;
    delete(key: string): boolean;
    clear(): void;
    getCacheStats(): {
        size: number;
        hitRate: number;
        missRate: number;
        expiredRate: number;
    };
    timePaymentOperation<T>(operation: string, paymentId: string, fn: () => Promise<T>): Promise<T>;
    timeDatabaseOperation<T>(operation: string, entity: string, fn: () => Promise<T>): Promise<T>;
    timeMNOOperation<T>(provider: string, operation: string, fn: () => Promise<T>): Promise<T>;
    cachePayment(paymentId: string, payment: any, ttl?: number): void;
    getCachedPayment(paymentId: string): any | null;
    cacheConsumer(consumerId: string, consumer: any, ttl?: number): void;
    getCachedConsumer(consumerId: string): any | null;
    cacheApiKey(apiKey: string, consumer: any, ttl?: number): void;
    getCachedApiKey(apiKey: string): any | null;
    getMemoryUsage(): {
        heapUsed: number;
        heapTotal: number;
        external: number;
        rss: number;
        cacheSize: number;
        profilesSize: number;
    };
    private cleanupCache;
    cleanupProfiles(): void;
}
