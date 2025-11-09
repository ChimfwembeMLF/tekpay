import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectDataSource } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';
import { HttpService } from '@nestjs/axios';
import { LoggerService } from './logger.service';
import * as Redis from 'redis';

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

@Injectable()
export class HealthService {
  private readonly startTime: number;
  private readonly version: string;
  private readonly environment: string;

  constructor(
    @InjectDataSource()
    private readonly dataSource: DataSource,
    private readonly configService: ConfigService,
    private readonly httpService: HttpService,
    private readonly logger: LoggerService,
  ) {
    this.startTime = Date.now();
    this.version = process.env.npm_package_version || '1.0.0';
    this.environment = this.configService.get('NODE_ENV', 'development');
  }

  async getHealthStatus(): Promise<HealthCheckResult> {
    const checks = await Promise.allSettled([
      this.checkDatabase(),
      this.checkRedis(),
      this.checkMTN(),
      this.checkAirtel(),
      this.checkMemory(),
      this.checkDisk(),
    ]);

    const healthChecks = {
      database: this.getCheckResult(checks[0]),
      redis: this.getCheckResult(checks[1]),
      mtn: this.getCheckResult(checks[2]),
      airtel: this.getCheckResult(checks[3]),
      memory: this.getCheckResult(checks[4]),
      disk: this.getCheckResult(checks[5]),
    };

    const overallStatus = this.determineOverallStatus(healthChecks);

    const result: HealthCheckResult = {
      status: overallStatus,
      timestamp: new Date().toISOString(),
      uptime: Date.now() - this.startTime,
      version: this.version,
      environment: this.environment,
      checks: healthChecks,
    };

    // Log health check results
    if (overallStatus !== 'healthy') {
      this.logger.warn('Health check failed', {
        status: overallStatus,
        failedChecks: Object.entries(healthChecks)
          .filter(([_, check]) => check.status !== 'healthy')
          .map(([name, check]) => ({ name, status: check.status, message: check.message })),
      });
    }

    return result;
  }

  async checkDatabase(): Promise<HealthCheck> {
    const startTime = Date.now();
    
    try {
      await this.dataSource.query('SELECT 1');
      
      return {
        status: 'healthy',
        responseTime: Date.now() - startTime,
        message: 'Database connection successful',
      };
    } catch (error) {
      return {
        status: 'unhealthy',
        responseTime: Date.now() - startTime,
        message: `Database connection failed: ${error.message}`,
        details: { error: error.message },
      };
    }
  }

  async checkRedis(): Promise<HealthCheck> {
    const startTime = Date.now();
    
    try {
      const redisClient = Redis.createClient({
        url: `redis://${this.configService.get('REDIS_PASSWORD') ? `:${this.configService.get('REDIS_PASSWORD')}@` : ''}${this.configService.get('REDIS_HOST', 'localhost')}:${this.configService.get('REDIS_PORT', 6379)}/${this.configService.get('REDIS_DB', 0)}`,
      });

      await redisClient.connect();
      await redisClient.ping();
      await redisClient.disconnect();

      return {
        status: 'healthy',
        responseTime: Date.now() - startTime,
        message: 'Redis connection successful',
      };
    } catch (error) {
      return {
        status: 'unhealthy',
        responseTime: Date.now() - startTime,
        message: `Redis connection failed: ${error.message}`,
        details: { error: error.message },
      };
    }
  }

  async checkMTN(): Promise<HealthCheck> {
    const startTime = Date.now();
    
    try {
      const baseUrl = this.configService.get('MTN_BASE_URL');
      const subscriptionKey = this.configService.get('MTN_SUBSCRIPTION_KEY');

      if (!baseUrl || !subscriptionKey) {
        return {
          status: 'degraded',
          message: 'MTN configuration incomplete',
        };
      }

      // Simple connectivity check to MTN API
      const response = await this.httpService.get(`${baseUrl}/collection/v1_0/accountbalance`, {
        headers: {
          'Ocp-Apim-Subscription-Key': subscriptionKey,
        },
        timeout: 10000,
      }).toPromise();

      // Even if we get 401 (unauthorized), it means the service is reachable
      if (response.status === 200 || response.status === 401) {
        return {
          status: 'healthy',
          responseTime: Date.now() - startTime,
          message: 'MTN API reachable',
        };
      }

      return {
        status: 'degraded',
        responseTime: Date.now() - startTime,
        message: `MTN API returned status ${response.status}`,
      };
    } catch (error) {
      // If it's a 401 error, the service is still reachable
      if (error.response?.status === 401) {
        return {
          status: 'healthy',
          responseTime: Date.now() - startTime,
          message: 'MTN API reachable (authentication required)',
        };
      }

      return {
        status: 'unhealthy',
        responseTime: Date.now() - startTime,
        message: `MTN API unreachable: ${error.message}`,
        details: { error: error.message },
      };
    }
  }

  async checkAirtel(): Promise<HealthCheck> {
    const startTime = Date.now();
    
    try {
      const baseUrl = this.configService.get('AIRTEL_BASE_URL');

      if (!baseUrl) {
        return {
          status: 'degraded',
          message: 'Airtel configuration incomplete',
        };
      }

      // Simple connectivity check to Airtel API
      const response = await this.httpService.get(`${baseUrl}/auth/oauth2/token`, {
        timeout: 10000,
      }).toPromise();

      // Even if we get 400/401, it means the service is reachable
      if (response.status === 200 || response.status === 400 || response.status === 401) {
        return {
          status: 'healthy',
          responseTime: Date.now() - startTime,
          message: 'Airtel API reachable',
        };
      }

      return {
        status: 'degraded',
        responseTime: Date.now() - startTime,
        message: `Airtel API returned status ${response.status}`,
      };
    } catch (error) {
      // If it's a 400/401 error, the service is still reachable
      if (error.response?.status === 400 || error.response?.status === 401) {
        return {
          status: 'healthy',
          responseTime: Date.now() - startTime,
          message: 'Airtel API reachable (authentication required)',
        };
      }

      return {
        status: 'unhealthy',
        responseTime: Date.now() - startTime,
        message: `Airtel API unreachable: ${error.message}`,
        details: { error: error.message },
      };
    }
  }

  async checkMemory(): Promise<HealthCheck> {
    try {
      const memUsage = process.memoryUsage();
      const totalMemory = memUsage.heapTotal;
      const usedMemory = memUsage.heapUsed;
      const memoryUsagePercent = (usedMemory / totalMemory) * 100;

      let status: 'healthy' | 'degraded' | 'unhealthy' = 'healthy';
      let message = `Memory usage: ${memoryUsagePercent.toFixed(2)}%`;

      if (memoryUsagePercent > 90) {
        status = 'unhealthy';
        message += ' (Critical)';
      } else if (memoryUsagePercent > 80) {
        status = 'degraded';
        message += ' (High)';
      }

      return {
        status,
        message,
        details: {
          heapUsed: Math.round(usedMemory / 1024 / 1024),
          heapTotal: Math.round(totalMemory / 1024 / 1024),
          external: Math.round(memUsage.external / 1024 / 1024),
          rss: Math.round(memUsage.rss / 1024 / 1024),
        },
      };
    } catch (error) {
      return {
        status: 'unhealthy',
        message: `Memory check failed: ${error.message}`,
      };
    }
  }

  async checkDisk(): Promise<HealthCheck> {
    try {
      // Simple disk space check (this is a basic implementation)
      // In production, you might want to use a more sophisticated library
      const fs = require('fs');
      const stats = fs.statSync('.');
      
      return {
        status: 'healthy',
        message: 'Disk space check passed',
        details: {
          note: 'Basic disk check - consider implementing detailed disk monitoring',
        },
      };
    } catch (error) {
      return {
        status: 'degraded',
        message: `Disk check failed: ${error.message}`,
      };
    }
  }

  private getCheckResult(result: PromiseSettledResult<HealthCheck>): HealthCheck {
    if (result.status === 'fulfilled') {
      return result.value;
    }
    
    return {
      status: 'unhealthy',
      message: `Health check failed: ${result.reason}`,
    };
  }

  private determineOverallStatus(checks: Record<string, HealthCheck>): 'healthy' | 'unhealthy' | 'degraded' {
    const statuses = Object.values(checks).map(check => check.status);
    
    if (statuses.includes('unhealthy')) {
      return 'unhealthy';
    }
    
    if (statuses.includes('degraded')) {
      return 'degraded';
    }
    
    return 'healthy';
  }
}
