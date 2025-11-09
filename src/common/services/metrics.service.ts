import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { LoggerService } from './logger.service';

export interface MetricData {
  name: string;
  value: number;
  timestamp: number;
  tags?: Record<string, string>;
}

export interface CounterMetric {
  count: number;
  lastIncrement: number;
}

export interface GaugeMetric {
  value: number;
  lastUpdate: number;
}

export interface HistogramMetric {
  count: number;
  sum: number;
  min: number;
  max: number;
  buckets: Map<number, number>;
  lastUpdate: number;
}

export interface TimerMetric {
  count: number;
  totalTime: number;
  minTime: number;
  maxTime: number;
  avgTime: number;
  lastUpdate: number;
}

@Injectable()
export class MetricsService {
  private readonly counters = new Map<string, CounterMetric>();
  private readonly gauges = new Map<string, GaugeMetric>();
  private readonly histograms = new Map<string, HistogramMetric>();
  private readonly timers = new Map<string, TimerMetric>();
  private readonly metricsEnabled: boolean;

  constructor(
    private readonly configService: ConfigService,
    private readonly logger: LoggerService,
  ) {
    this.metricsEnabled = configService.get('METRICS_ENABLED', 'false') === 'true';
  }

  // Counter methods
  incrementCounter(name: string, value: number = 1, tags?: Record<string, string>): void {
    if (!this.metricsEnabled) return;

    const key = this.getMetricKey(name, tags);
    const existing = this.counters.get(key) || { count: 0, lastIncrement: 0 };
    
    this.counters.set(key, {
      count: existing.count + value,
      lastIncrement: Date.now(),
    });

    this.logger.debug(`Counter incremented: ${name}`, { value, tags });
  }

  getCounter(name: string, tags?: Record<string, string>): CounterMetric | undefined {
    const key = this.getMetricKey(name, tags);
    return this.counters.get(key);
  }

  // Gauge methods
  setGauge(name: string, value: number, tags?: Record<string, string>): void {
    if (!this.metricsEnabled) return;

    const key = this.getMetricKey(name, tags);
    this.gauges.set(key, {
      value,
      lastUpdate: Date.now(),
    });

    this.logger.debug(`Gauge set: ${name}`, { value, tags });
  }

  getGauge(name: string, tags?: Record<string, string>): GaugeMetric | undefined {
    const key = this.getMetricKey(name, tags);
    return this.gauges.get(key);
  }

  // Histogram methods
  recordHistogram(name: string, value: number, tags?: Record<string, string>): void {
    if (!this.metricsEnabled) return;

    const key = this.getMetricKey(name, tags);
    const existing = this.histograms.get(key) || {
      count: 0,
      sum: 0,
      min: Infinity,
      max: -Infinity,
      buckets: new Map(),
      lastUpdate: 0,
    };

    const updated: HistogramMetric = {
      count: existing.count + 1,
      sum: existing.sum + value,
      min: Math.min(existing.min, value),
      max: Math.max(existing.max, value),
      buckets: existing.buckets,
      lastUpdate: Date.now(),
    };

    // Update buckets (simple implementation with predefined buckets)
    const buckets = [1, 5, 10, 25, 50, 100, 250, 500, 1000, 2500, 5000, 10000];
    for (const bucket of buckets) {
      if (value <= bucket) {
        updated.buckets.set(bucket, (updated.buckets.get(bucket) || 0) + 1);
      }
    }

    this.histograms.set(key, updated);
    this.logger.debug(`Histogram recorded: ${name}`, { value, tags });
  }

  getHistogram(name: string, tags?: Record<string, string>): HistogramMetric | undefined {
    const key = this.getMetricKey(name, tags);
    return this.histograms.get(key);
  }

  // Timer methods
  startTimer(name: string, tags?: Record<string, string>): () => void {
    const startTime = Date.now();
    
    return () => {
      const duration = Date.now() - startTime;
      this.recordTimer(name, duration, tags);
    };
  }

  recordTimer(name: string, duration: number, tags?: Record<string, string>): void {
    if (!this.metricsEnabled) return;

    const key = this.getMetricKey(name, tags);
    const existing = this.timers.get(key) || {
      count: 0,
      totalTime: 0,
      minTime: Infinity,
      maxTime: -Infinity,
      avgTime: 0,
      lastUpdate: 0,
    };

    const updated: TimerMetric = {
      count: existing.count + 1,
      totalTime: existing.totalTime + duration,
      minTime: Math.min(existing.minTime, duration),
      maxTime: Math.max(existing.maxTime, duration),
      avgTime: 0,
      lastUpdate: Date.now(),
    };

    updated.avgTime = updated.totalTime / updated.count;

    this.timers.set(key, updated);
    this.logger.debug(`Timer recorded: ${name}`, { duration, tags });
  }

  getTimer(name: string, tags?: Record<string, string>): TimerMetric | undefined {
    const key = this.getMetricKey(name, tags);
    return this.timers.get(key);
  }

  // Business-specific metrics
  recordPaymentCreated(mno: string, amount: number): void {
    this.incrementCounter('payments.created.total', 1, { mno });
    this.recordHistogram('payments.amount', amount, { mno, event: 'created' });
  }

  recordPaymentCompleted(mno: string, amount: number, duration: number): void {
    this.incrementCounter('payments.completed.total', 1, { mno });
    this.recordHistogram('payments.amount', amount, { mno, event: 'completed' });
    this.recordTimer('payments.completion_time', duration, { mno });
  }

  recordPaymentFailed(mno: string, reason: string): void {
    this.incrementCounter('payments.failed.total', 1, { mno, reason });
  }

  recordApiCall(method: string, endpoint: string, statusCode: number, duration: number): void {
    this.incrementCounter('api.requests.total', 1, { method, endpoint, status: statusCode.toString() });
    this.recordTimer('api.request_duration', duration, { method, endpoint });
  }

  recordWebhookReceived(provider: string, status: string): void {
    this.incrementCounter('webhooks.received.total', 1, { provider, status });
  }

  recordMnoApiCall(provider: string, operation: string, success: boolean, duration: number): void {
    this.incrementCounter('mno.api.calls.total', 1, { 
      provider, 
      operation, 
      success: success.toString() 
    });
    this.recordTimer('mno.api.duration', duration, { provider, operation });
  }

  recordDatabaseQuery(operation: string, duration: number, success: boolean): void {
    this.incrementCounter('database.queries.total', 1, { 
      operation, 
      success: success.toString() 
    });
    this.recordTimer('database.query_duration', duration, { operation });
  }

  recordRedisOperation(operation: string, duration: number, success: boolean): void {
    this.incrementCounter('redis.operations.total', 1, { 
      operation, 
      success: success.toString() 
    });
    this.recordTimer('redis.operation_duration', duration, { operation });
  }

  // System metrics
  recordMemoryUsage(): void {
    const memUsage = process.memoryUsage();
    this.setGauge('system.memory.heap_used', memUsage.heapUsed);
    this.setGauge('system.memory.heap_total', memUsage.heapTotal);
    this.setGauge('system.memory.external', memUsage.external);
    this.setGauge('system.memory.rss', memUsage.rss);
  }

  recordCpuUsage(): void {
    const cpuUsage = process.cpuUsage();
    this.setGauge('system.cpu.user', cpuUsage.user);
    this.setGauge('system.cpu.system', cpuUsage.system);
  }

  // Export methods
  getAllMetrics(): {
    counters: Record<string, CounterMetric>;
    gauges: Record<string, GaugeMetric>;
    histograms: Record<string, HistogramMetric>;
    timers: Record<string, TimerMetric>;
  } {
    return {
      counters: Object.fromEntries(this.counters),
      gauges: Object.fromEntries(this.gauges),
      histograms: Object.fromEntries(this.histograms),
      timers: Object.fromEntries(this.timers),
    };
  }

  getPrometheusMetrics(): string {
    const lines: string[] = [];

    // Export counters
    for (const [key, metric] of this.counters) {
      lines.push(`# TYPE ${key} counter`);
      lines.push(`${key} ${metric.count}`);
    }

    // Export gauges
    for (const [key, metric] of this.gauges) {
      lines.push(`# TYPE ${key} gauge`);
      lines.push(`${key} ${metric.value}`);
    }

    // Export histograms
    for (const [key, metric] of this.histograms) {
      lines.push(`# TYPE ${key} histogram`);
      lines.push(`${key}_count ${metric.count}`);
      lines.push(`${key}_sum ${metric.sum}`);
      
      for (const [bucket, count] of metric.buckets) {
        lines.push(`${key}_bucket{le="${bucket}"} ${count}`);
      }
    }

    return lines.join('\n');
  }

  private getMetricKey(name: string, tags?: Record<string, string>): string {
    if (!tags || Object.keys(tags).length === 0) {
      return name;
    }

    const tagString = Object.entries(tags)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([key, value]) => `${key}=${value}`)
      .join(',');

    return `${name}{${tagString}}`;
  }

  // Cleanup old metrics (call periodically)
  cleanup(maxAge: number = 24 * 60 * 60 * 1000): void {
    const now = Date.now();
    
    for (const [key, metric] of this.counters) {
      if (now - metric.lastIncrement > maxAge) {
        this.counters.delete(key);
      }
    }

    for (const [key, metric] of this.gauges) {
      if (now - metric.lastUpdate > maxAge) {
        this.gauges.delete(key);
      }
    }

    for (const [key, metric] of this.histograms) {
      if (now - metric.lastUpdate > maxAge) {
        this.histograms.delete(key);
      }
    }

    for (const [key, metric] of this.timers) {
      if (now - metric.lastUpdate > maxAge) {
        this.timers.delete(key);
      }
    }
  }
}
