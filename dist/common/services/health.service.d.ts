import { ConfigService } from '@nestjs/config';
import { DataSource } from 'typeorm';
import { HttpService } from '@nestjs/axios';
import { LoggerService } from './logger.service';
export interface HealthCheckResult {
    status: 'healthy' | 'unhealthy' | 'degraded';
    timestamp: string;
    uptime: number;
    version: string;
    environment: string;
    checks: {
        database: HealthCheck;
        redis: HealthCheck;
        mtn: HealthCheck;
        airtel: HealthCheck;
        memory: HealthCheck;
        disk: HealthCheck;
    };
}
export interface HealthCheck {
    status: 'healthy' | 'unhealthy' | 'degraded';
    responseTime?: number;
    message?: string;
    details?: any;
}
export declare class HealthService {
    private readonly dataSource;
    private readonly configService;
    private readonly httpService;
    private readonly logger;
    private readonly startTime;
    private readonly version;
    private readonly environment;
    constructor(dataSource: DataSource, configService: ConfigService, httpService: HttpService, logger: LoggerService);
    getHealthStatus(): Promise<HealthCheckResult>;
    checkDatabase(): Promise<HealthCheck>;
    checkRedis(): Promise<HealthCheck>;
    checkMTN(): Promise<HealthCheck>;
    checkAirtel(): Promise<HealthCheck>;
    checkMemory(): Promise<HealthCheck>;
    checkDisk(): Promise<HealthCheck>;
    private getCheckResult;
    private determineOverallStatus;
}
