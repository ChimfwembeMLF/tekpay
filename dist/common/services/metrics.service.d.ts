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
export declare class MetricsService {
    private readonly configService;
    private readonly logger;
    private readonly counters;
    private readonly gauges;
    private readonly histograms;
    private readonly timers;
    private readonly metricsEnabled;
    constructor(configService: ConfigService, logger: LoggerService);
    incrementCounter(name: string, value?: number, tags?: Record<string, string>): void;
    getCounter(name: string, tags?: Record<string, string>): CounterMetric | undefined;
    setGauge(name: string, value: number, tags?: Record<string, string>): void;
    getGauge(name: string, tags?: Record<string, string>): GaugeMetric | undefined;
    recordHistogram(name: string, value: number, tags?: Record<string, string>): void;
    getHistogram(name: string, tags?: Record<string, string>): HistogramMetric | undefined;
    startTimer(name: string, tags?: Record<string, string>): () => void;
    recordTimer(name: string, duration: number, tags?: Record<string, string>): void;
    getTimer(name: string, tags?: Record<string, string>): TimerMetric | undefined;
    recordPaymentCreated(mno: string, amount: number): void;
    recordPaymentCompleted(mno: string, amount: number, duration: number): void;
    recordPaymentFailed(mno: string, reason: string): void;
    recordApiCall(method: string, endpoint: string, statusCode: number, duration: number): void;
    recordWebhookReceived(provider: string, status: string): void;
    recordMnoApiCall(provider: string, operation: string, success: boolean, duration: number): void;
    recordDatabaseQuery(operation: string, duration: number, success: boolean): void;
    recordRedisOperation(operation: string, duration: number, success: boolean): void;
    recordMemoryUsage(): void;
    recordCpuUsage(): void;
    getAllMetrics(): {
        counters: Record<string, CounterMetric>;
        gauges: Record<string, GaugeMetric>;
        histograms: Record<string, HistogramMetric>;
        timers: Record<string, TimerMetric>;
    };
    getPrometheusMetrics(): string;
    private getMetricKey;
    cleanup(maxAge?: number): void;
}
