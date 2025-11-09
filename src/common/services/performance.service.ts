import { Injectable } from '@nestjs/common';
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

@Injectable()
export class PerformanceService {
  private readonly profiles = new Map<string, PerformanceProfile>();
  private readonly cache = new Map<string, CacheEntry<any>>();
  private readonly performanceEnabled: boolean;
  private readonly cacheEnabled: boolean;
  private readonly defaultCacheTTL: number;

  constructor(
    private readonly configService: ConfigService,
    private readonly logger: LoggerService,
    private readonly metrics: MetricsService,
  ) {
    this.performanceEnabled = configService.get('PERFORMANCE_MONITORING_ENABLED', 'false') === 'true';
    this.cacheEnabled = configService.get('CACHE_ENABLED', 'true') === 'true';
    this.defaultCacheTTL = parseInt(configService.get('DEFAULT_CACHE_TTL', '300000'), 10); // 5 minutes

    // Start periodic cleanup
    if (this.cacheEnabled) {
      setInterval(() => this.cleanupCache(), 60000); // Cleanup every minute
    }
  }

  // Performance profiling methods
  startProfile(name: string, metadata?: Record<string, any>): string {
    if (!this.performanceEnabled) return name;

    const profileId = `${name}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    this.profiles.set(profileId, {
      name,
      startTime: Date.now(),
      metadata,
    });

    this.logger.debug(`Performance profile started: ${name}`, { profileId, metadata });
    return profileId;
  }

  endProfile(profileId: string): PerformanceProfile | null {
    if (!this.performanceEnabled) return null;

    const profile = this.profiles.get(profileId);
    if (!profile) {
      this.logger.warn(`Performance profile not found: ${profileId}`);
      return null;
    }

    profile.endTime = Date.now();
    profile.duration = profile.endTime - profile.startTime;

    // Log performance data
    this.logger.debug(`Performance profile completed: ${profile.name}`, {
      profileId,
      duration: profile.duration,
      metadata: profile.metadata,
    });

    // Record metrics
    this.metrics.recordTimer(`performance.${profile.name}`, profile.duration, profile.metadata);

    // Cleanup
    this.profiles.delete(profileId);

    return profile;
  }

  // Convenience method for timing functions
  async timeFunction<T>(
    name: string,
    fn: () => Promise<T>,
    metadata?: Record<string, any>
  ): Promise<T> {
    const profileId = this.startProfile(name, metadata);
    
    try {
      const result = await fn();
      this.endProfile(profileId);
      return result;
    } catch (error) {
      this.endProfile(profileId);
      this.metrics.incrementCounter(`performance.${name}.errors`, 1, metadata);
      throw error;
    }
  }

  // Cache methods
  set<T>(key: string, data: T, ttl?: number): void {
    if (!this.cacheEnabled) return;

    const entry: CacheEntry<T> = {
      data,
      timestamp: Date.now(),
      ttl: ttl || this.defaultCacheTTL,
    };

    this.cache.set(key, entry);
    this.metrics.incrementCounter('cache.set.total', 1);
    
    this.logger.debug(`Cache entry set: ${key}`, { ttl: entry.ttl });
  }

  get<T>(key: string): T | null {
    if (!this.cacheEnabled) return null;

    const entry = this.cache.get(key) as CacheEntry<T>;
    if (!entry) {
      this.metrics.incrementCounter('cache.miss.total', 1);
      return null;
    }

    // Check if entry has expired
    if (Date.now() - entry.timestamp > entry.ttl) {
      this.cache.delete(key);
      this.metrics.incrementCounter('cache.expired.total', 1);
      return null;
    }

    this.metrics.incrementCounter('cache.hit.total', 1);
    this.logger.debug(`Cache hit: ${key}`);
    
    return entry.data;
  }

  delete(key: string): boolean {
    if (!this.cacheEnabled) return false;

    const deleted = this.cache.delete(key);
    if (deleted) {
      this.metrics.incrementCounter('cache.delete.total', 1);
      this.logger.debug(`Cache entry deleted: ${key}`);
    }
    
    return deleted;
  }

  clear(): void {
    if (!this.cacheEnabled) return;

    const size = this.cache.size;
    this.cache.clear();
    this.metrics.incrementCounter('cache.clear.total', 1);
    this.logger.debug(`Cache cleared: ${size} entries removed`);
  }

  // Cache statistics
  getCacheStats(): {
    size: number;
    hitRate: number;
    missRate: number;
    expiredRate: number;
  } {
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

  // Business-specific performance helpers
  async timePaymentOperation<T>(
    operation: string,
    paymentId: string,
    fn: () => Promise<T>
  ): Promise<T> {
    return this.timeFunction(
      `payment.${operation}`,
      fn,
      { paymentId, operation }
    );
  }

  async timeDatabaseOperation<T>(
    operation: string,
    entity: string,
    fn: () => Promise<T>
  ): Promise<T> {
    return this.timeFunction(
      `database.${operation}`,
      fn,
      { entity, operation }
    );
  }

  async timeMNOOperation<T>(
    provider: string,
    operation: string,
    fn: () => Promise<T>
  ): Promise<T> {
    return this.timeFunction(
      `mno.${provider.toLowerCase()}.${operation}`,
      fn,
      { provider, operation }
    );
  }

  // Cache helpers for common operations
  cachePayment(paymentId: string, payment: any, ttl?: number): void {
    this.set(`payment:${paymentId}`, payment, ttl);
  }

  getCachedPayment(paymentId: string): any | null {
    return this.get(`payment:${paymentId}`);
  }

  cacheConsumer(consumerId: string, consumer: any, ttl?: number): void {
    this.set(`consumer:${consumerId}`, consumer, ttl);
  }

  getCachedConsumer(consumerId: string): any | null {
    return this.get(`consumer:${consumerId}`);
  }

  cacheApiKey(apiKey: string, consumer: any, ttl?: number): void {
    this.set(`apikey:${apiKey}`, consumer, ttl || 600000); // 10 minutes for API keys
  }

  getCachedApiKey(apiKey: string): any | null {
    return this.get(`apikey:${apiKey}`);
  }

  // Memory optimization
  getMemoryUsage(): {
    heapUsed: number;
    heapTotal: number;
    external: number;
    rss: number;
    cacheSize: number;
    profilesSize: number;
  } {
    const memUsage = process.memoryUsage();
    
    return {
      heapUsed: Math.round(memUsage.heapUsed / 1024 / 1024), // MB
      heapTotal: Math.round(memUsage.heapTotal / 1024 / 1024), // MB
      external: Math.round(memUsage.external / 1024 / 1024), // MB
      rss: Math.round(memUsage.rss / 1024 / 1024), // MB
      cacheSize: this.cache.size,
      profilesSize: this.profiles.size,
    };
  }

  // Cleanup methods
  private cleanupCache(): void {
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

  // Cleanup old profiles (in case endProfile wasn't called)
  cleanupProfiles(): void {
    const now = Date.now();
    const maxAge = 300000; // 5 minutes
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
}
