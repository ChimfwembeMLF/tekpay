import { HealthService, HealthCheckResult } from '../services/health.service';
import { MetricsService } from '../services/metrics.service';
import { LoggerService } from '../services/logger.service';
export declare class MonitoringController {
    private readonly healthService;
    private readonly metricsService;
    private readonly logger;
    constructor(healthService: HealthService, metricsService: MetricsService, logger: LoggerService);
    getHealth(): Promise<HealthCheckResult>;
    getLiveness(): {
        status: string;
        timestamp: string;
    };
    getReadiness(): Promise<{
        status: string;
        timestamp: string;
        ready: boolean;
    }>;
    getMetrics(): any;
    getPrometheusMetrics(): string;
    getVersion(): {
        version: string;
        environment: string;
        buildTime?: string;
        gitCommit?: string;
        nodeVersion: string;
    };
    getStatus(): {
        status: string;
        timestamp: string;
        uptime: number;
        environment: string;
    };
}
