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
exports.MetricsService = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const logger_service_1 = require("./logger.service");
let MetricsService = class MetricsService {
    constructor(configService, logger) {
        this.configService = configService;
        this.logger = logger;
        this.counters = new Map();
        this.gauges = new Map();
        this.histograms = new Map();
        this.timers = new Map();
        this.metricsEnabled = configService.get('METRICS_ENABLED', 'false') === 'true';
    }
    incrementCounter(name, value = 1, tags) {
        if (!this.metricsEnabled)
            return;
        const key = this.getMetricKey(name, tags);
        const existing = this.counters.get(key) || { count: 0, lastIncrement: 0 };
        this.counters.set(key, {
            count: existing.count + value,
            lastIncrement: Date.now(),
        });
        this.logger.debug(`Counter incremented: ${name}`, { value, tags });
    }
    getCounter(name, tags) {
        const key = this.getMetricKey(name, tags);
        return this.counters.get(key);
    }
    setGauge(name, value, tags) {
        if (!this.metricsEnabled)
            return;
        const key = this.getMetricKey(name, tags);
        this.gauges.set(key, {
            value,
            lastUpdate: Date.now(),
        });
        this.logger.debug(`Gauge set: ${name}`, { value, tags });
    }
    getGauge(name, tags) {
        const key = this.getMetricKey(name, tags);
        return this.gauges.get(key);
    }
    recordHistogram(name, value, tags) {
        if (!this.metricsEnabled)
            return;
        const key = this.getMetricKey(name, tags);
        const existing = this.histograms.get(key) || {
            count: 0,
            sum: 0,
            min: Infinity,
            max: -Infinity,
            buckets: new Map(),
            lastUpdate: 0,
        };
        const updated = {
            count: existing.count + 1,
            sum: existing.sum + value,
            min: Math.min(existing.min, value),
            max: Math.max(existing.max, value),
            buckets: existing.buckets,
            lastUpdate: Date.now(),
        };
        const buckets = [1, 5, 10, 25, 50, 100, 250, 500, 1000, 2500, 5000, 10000];
        for (const bucket of buckets) {
            if (value <= bucket) {
                updated.buckets.set(bucket, (updated.buckets.get(bucket) || 0) + 1);
            }
        }
        this.histograms.set(key, updated);
        this.logger.debug(`Histogram recorded: ${name}`, { value, tags });
    }
    getHistogram(name, tags) {
        const key = this.getMetricKey(name, tags);
        return this.histograms.get(key);
    }
    startTimer(name, tags) {
        const startTime = Date.now();
        return () => {
            const duration = Date.now() - startTime;
            this.recordTimer(name, duration, tags);
        };
    }
    recordTimer(name, duration, tags) {
        if (!this.metricsEnabled)
            return;
        const key = this.getMetricKey(name, tags);
        const existing = this.timers.get(key) || {
            count: 0,
            totalTime: 0,
            minTime: Infinity,
            maxTime: -Infinity,
            avgTime: 0,
            lastUpdate: 0,
        };
        const updated = {
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
    getTimer(name, tags) {
        const key = this.getMetricKey(name, tags);
        return this.timers.get(key);
    }
    recordPaymentCreated(mno, amount) {
        this.incrementCounter('payments.created.total', 1, { mno });
        this.recordHistogram('payments.amount', amount, { mno, event: 'created' });
    }
    recordPaymentCompleted(mno, amount, duration) {
        this.incrementCounter('payments.completed.total', 1, { mno });
        this.recordHistogram('payments.amount', amount, { mno, event: 'completed' });
        this.recordTimer('payments.completion_time', duration, { mno });
    }
    recordPaymentFailed(mno, reason) {
        this.incrementCounter('payments.failed.total', 1, { mno, reason });
    }
    recordApiCall(method, endpoint, statusCode, duration) {
        this.incrementCounter('api.requests.total', 1, { method, endpoint, status: statusCode.toString() });
        this.recordTimer('api.request_duration', duration, { method, endpoint });
    }
    recordWebhookReceived(provider, status) {
        this.incrementCounter('webhooks.received.total', 1, { provider, status });
    }
    recordMnoApiCall(provider, operation, success, duration) {
        this.incrementCounter('mno.api.calls.total', 1, {
            provider,
            operation,
            success: success.toString()
        });
        this.recordTimer('mno.api.duration', duration, { provider, operation });
    }
    recordDatabaseQuery(operation, duration, success) {
        this.incrementCounter('database.queries.total', 1, {
            operation,
            success: success.toString()
        });
        this.recordTimer('database.query_duration', duration, { operation });
    }
    recordRedisOperation(operation, duration, success) {
        this.incrementCounter('redis.operations.total', 1, {
            operation,
            success: success.toString()
        });
        this.recordTimer('redis.operation_duration', duration, { operation });
    }
    recordMemoryUsage() {
        const memUsage = process.memoryUsage();
        this.setGauge('system.memory.heap_used', memUsage.heapUsed);
        this.setGauge('system.memory.heap_total', memUsage.heapTotal);
        this.setGauge('system.memory.external', memUsage.external);
        this.setGauge('system.memory.rss', memUsage.rss);
    }
    recordCpuUsage() {
        const cpuUsage = process.cpuUsage();
        this.setGauge('system.cpu.user', cpuUsage.user);
        this.setGauge('system.cpu.system', cpuUsage.system);
    }
    getAllMetrics() {
        return {
            counters: Object.fromEntries(this.counters),
            gauges: Object.fromEntries(this.gauges),
            histograms: Object.fromEntries(this.histograms),
            timers: Object.fromEntries(this.timers),
        };
    }
    getPrometheusMetrics() {
        const lines = [];
        for (const [key, metric] of this.counters) {
            lines.push(`# TYPE ${key} counter`);
            lines.push(`${key} ${metric.count}`);
        }
        for (const [key, metric] of this.gauges) {
            lines.push(`# TYPE ${key} gauge`);
            lines.push(`${key} ${metric.value}`);
        }
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
    getMetricKey(name, tags) {
        if (!tags || Object.keys(tags).length === 0) {
            return name;
        }
        const tagString = Object.entries(tags)
            .sort(([a], [b]) => a.localeCompare(b))
            .map(([key, value]) => `${key}=${value}`)
            .join(',');
        return `${name}{${tagString}}`;
    }
    cleanup(maxAge = 24 * 60 * 60 * 1000) {
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
};
exports.MetricsService = MetricsService;
exports.MetricsService = MetricsService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [config_1.ConfigService,
        logger_service_1.LoggerService])
], MetricsService);
//# sourceMappingURL=metrics.service.js.map