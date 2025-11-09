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
exports.PerformanceService = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const logger_service_1 = require("./logger.service");
const metrics_service_1 = require("./metrics.service");
let PerformanceService = class PerformanceService {
    constructor(configService, logger, metrics) {
        this.configService = configService;
        this.logger = logger;
        this.metrics = metrics;
        this.profiles = new Map();
        this.cache = new Map();
        this.performanceEnabled = configService.get('PERFORMANCE_MONITORING_ENABLED', 'false') === 'true';
        this.cacheEnabled = configService.get('CACHE_ENABLED', 'true') === 'true';
        this.defaultCacheTTL = parseInt(configService.get('DEFAULT_CACHE_TTL', '300000'), 10);
        if (this.cacheEnabled) {
            setInterval(() => this.cleanupCache(), 60000);
        }
    }
    startProfile(name, metadata) {
        if (!this.performanceEnabled)
            return name;
        const profileId = `${name}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        this.profiles.set(profileId, {
            name,
            startTime: Date.now(),
            metadata,
        });
        this.logger.debug(`Performance profile started: ${name}`, { profileId, metadata });
        return profileId;
    }
    endProfile(profileId) {
        if (!this.performanceEnabled)
            return null;
        const profile = this.profiles.get(profileId);
        if (!profile) {
            this.logger.warn(`Performance profile not found: ${profileId}`);
            return null;
        }
        profile.endTime = Date.now();
        profile.duration = profile.endTime - profile.startTime;
        this.logger.debug(`Performance profile completed: ${profile.name}`, {
            profileId,
            duration: profile.duration,
            metadata: profile.metadata,
        });
        this.metrics.recordTimer(`performance.${profile.name}`, profile.duration, profile.metadata);
        this.profiles.delete(profileId);
        return profile;
    }
    async timeFunction(name, fn, metadata) {
        const profileId = this.startProfile(name, metadata);
        try {
            const result = await fn();
            this.endProfile(profileId);
            return result;
        }
        catch (error) {
            this.endProfile(profileId);
            this.metrics.incrementCounter(`performance.${name}.errors`, 1, metadata);
            throw error;
        }
    }
    set(key, data, ttl) {
        if (!this.cacheEnabled)
            return;
        const entry = {
            data,
            timestamp: Date.now(),
            ttl: ttl || this.defaultCacheTTL,
        };
        this.cache.set(key, entry);
        this.metrics.incrementCounter('cache.set.total', 1);
        this.logger.debug(`Cache entry set: ${key}`, { ttl: entry.ttl });
    }
    get(key) {
        if (!this.cacheEnabled)
            return null;
        const entry = this.cache.get(key);
        if (!entry) {
            this.metrics.incrementCounter('cache.miss.total', 1);
            return null;
        }
        if (Date.now() - entry.timestamp > entry.ttl) {
            this.cache.delete(key);
            this.metrics.incrementCounter('cache.expired.total', 1);
            return null;
        }
        this.metrics.incrementCounter('cache.hit.total', 1);
        this.logger.debug(`Cache hit: ${key}`);
        return entry.data;
    }
    delete(key) {
        if (!this.cacheEnabled)
            return false;
        const deleted = this.cache.delete(key);
        if (deleted) {
            this.metrics.incrementCounter('cache.delete.total', 1);
            this.logger.debug(`Cache entry deleted: ${key}`);
        }
        return deleted;
    }
    clear() {
        if (!this.cacheEnabled)
            return;
        const size = this.cache.size;
        this.cache.clear();
        this.metrics.incrementCounter('cache.clear.total', 1);
        this.logger.debug(`Cache cleared: ${size} entries removed`);
    }
    getCacheStats() {
        const hits = this.metrics.getCounter('cache.hit.total')?.count || 0;
        const misses = this.metrics.getCounter('cache.miss.total')?.count || 0;
        const expired = this.metrics.getCounter('cache.expired.total')?.count || 0;
        const total = hits + misses + expired;
        return {
            size: this.cache.size,
            hitRate: total > 0 ? hits / total : 0,
            missRate: total > 0 ? misses / total : 0,
            expiredRate: total > 0 ? expired / total : 0,
        };
    }
    async timePaymentOperation(operation, paymentId, fn) {
        return this.timeFunction(`payment.${operation}`, fn, { paymentId, operation });
    }
    async timeDatabaseOperation(operation, entity, fn) {
        return this.timeFunction(`database.${operation}`, fn, { entity, operation });
    }
    async timeMNOOperation(provider, operation, fn) {
        return this.timeFunction(`mno.${provider.toLowerCase()}.${operation}`, fn, { provider, operation });
    }
    cachePayment(paymentId, payment, ttl) {
        this.set(`payment:${paymentId}`, payment, ttl);
    }
    getCachedPayment(paymentId) {
        return this.get(`payment:${paymentId}`);
    }
    cacheConsumer(consumerId, consumer, ttl) {
        this.set(`consumer:${consumerId}`, consumer, ttl);
    }
    getCachedConsumer(consumerId) {
        return this.get(`consumer:${consumerId}`);
    }
    cacheApiKey(apiKey, consumer, ttl) {
        this.set(`apikey:${apiKey}`, consumer, ttl || 600000);
    }
    getCachedApiKey(apiKey) {
        return this.get(`apikey:${apiKey}`);
    }
    getMemoryUsage() {
        const memUsage = process.memoryUsage();
        return {
            heapUsed: Math.round(memUsage.heapUsed / 1024 / 1024),
            heapTotal: Math.round(memUsage.heapTotal / 1024 / 1024),
            external: Math.round(memUsage.external / 1024 / 1024),
            rss: Math.round(memUsage.rss / 1024 / 1024),
            cacheSize: this.cache.size,
            profilesSize: this.profiles.size,
        };
    }
    cleanupCache() {
        const now = Date.now();
        let cleanedCount = 0;
        for (const [key, entry] of this.cache.entries()) {
            if (now - entry.timestamp > entry.ttl) {
                this.cache.delete(key);
                cleanedCount++;
            }
        }
        if (cleanedCount > 0) {
            this.metrics.incrementCounter('cache.cleanup.total', cleanedCount);
            this.logger.debug(`Cache cleanup completed: ${cleanedCount} entries removed`);
        }
    }
    cleanupProfiles() {
        const now = Date.now();
        const maxAge = 300000;
        let cleanedCount = 0;
        for (const [profileId, profile] of this.profiles.entries()) {
            if (now - profile.startTime > maxAge) {
                this.profiles.delete(profileId);
                cleanedCount++;
            }
        }
        if (cleanedCount > 0) {
            this.logger.warn(`Cleaned up ${cleanedCount} orphaned performance profiles`);
        }
    }
};
exports.PerformanceService = PerformanceService;
exports.PerformanceService = PerformanceService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [config_1.ConfigService,
        logger_service_1.LoggerService,
        metrics_service_1.MetricsService])
], PerformanceService);
//# sourceMappingURL=performance.service.js.map