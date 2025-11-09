import { Controller, Get, Header, HttpCode, HttpStatus } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { HealthService, HealthCheckResult } from '../services/health.service';
import { MetricsService } from '../services/metrics.service';
import { LoggerService } from '../services/logger.service';

@ApiTags('Monitoring')
@Controller()
export class MonitoringController {
  constructor(
    private readonly healthService: HealthService,
    private readonly metricsService: MetricsService,
    private readonly logger: LoggerService,
  ) {}

  @Get('health')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Health check endpoint' })
  @ApiResponse({ 
    status: 200, 
    description: 'Health check results',
    schema: {
      type: 'object',
      properties: {
        status: { type: 'string', enum: ['healthy', 'unhealthy', 'degraded'] },
        timestamp: { type: 'string' },
        uptime: { type: 'number' },
        version: { type: 'string' },
        environment: { type: 'string' },
        checks: {
          type: 'object',
          properties: {
            database: { $ref: '#/components/schemas/HealthCheck' },
            redis: { $ref: '#/components/schemas/HealthCheck' },
            mtn: { $ref: '#/components/schemas/HealthCheck' },
            airtel: { $ref: '#/components/schemas/HealthCheck' },
            memory: { $ref: '#/components/schemas/HealthCheck' },
            disk: { $ref: '#/components/schemas/HealthCheck' },
          },
        },
      },
    },
  })
  async getHealth(): Promise<HealthCheckResult> {
    const startTime = Date.now();
    
    try {
      const health = await this.healthService.getHealthStatus();
      
      // Record metrics
      this.metricsService.recordTimer('health_check.duration', Date.now() - startTime);
      this.metricsService.incrementCounter('health_check.requests.total', 1, { 
        status: health.status 
      });

      return health;
    } catch (error) {
      this.logger.error('Health check failed', error);
      this.metricsService.incrementCounter('health_check.requests.total', 1, { 
        status: 'error' 
      });
      throw error;
    }
  }

  @Get('health/live')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Liveness probe - basic application status' })
  @ApiResponse({ status: 200, description: 'Application is running' })
  getLiveness(): { status: string; timestamp: string } {
    return {
      status: 'alive',
      timestamp: new Date().toISOString(),
    };
  }

  @Get('health/ready')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Readiness probe - application ready to serve traffic' })
  @ApiResponse({ status: 200, description: 'Application is ready' })
  @ApiResponse({ status: 503, description: 'Application is not ready' })
  async getReadiness(): Promise<{ status: string; timestamp: string; ready: boolean }> {
    try {
      const health = await this.healthService.getHealthStatus();
      const ready = health.status === 'healthy' || health.status === 'degraded';
      
      return {
        status: ready ? 'ready' : 'not_ready',
        timestamp: new Date().toISOString(),
        ready,
      };
    } catch (error) {
      this.logger.error('Readiness check failed', error);
      return {
        status: 'not_ready',
        timestamp: new Date().toISOString(),
        ready: false,
      };
    }
  }

  @Get('metrics')
  @Header('Content-Type', 'application/json')
  @ApiOperation({ summary: 'Application metrics in JSON format' })
  @ApiResponse({ status: 200, description: 'Application metrics' })
  getMetrics(): any {
    try {
      // Update system metrics before returning
      this.metricsService.recordMemoryUsage();
      this.metricsService.recordCpuUsage();

      const metrics = this.metricsService.getAllMetrics();
      
      this.metricsService.incrementCounter('metrics.requests.total', 1, { 
        format: 'json' 
      });

      return {
        timestamp: new Date().toISOString(),
        metrics,
      };
    } catch (error) {
      this.logger.error('Failed to get metrics', error);
      throw error;
    }
  }

  @Get('metrics/prometheus')
  @Header('Content-Type', 'text/plain; version=0.0.4; charset=utf-8')
  @ApiOperation({ summary: 'Application metrics in Prometheus format' })
  @ApiResponse({ 
    status: 200, 
    description: 'Application metrics in Prometheus format',
    content: {
      'text/plain': {
        schema: { type: 'string' }
      }
    }
  })
  getPrometheusMetrics(): string {
    try {
      // Update system metrics before returning
      this.metricsService.recordMemoryUsage();
      this.metricsService.recordCpuUsage();

      const metrics = this.metricsService.getPrometheusMetrics();
      
      this.metricsService.incrementCounter('metrics.requests.total', 1, { 
        format: 'prometheus' 
      });

      return metrics;
    } catch (error) {
      this.logger.error('Failed to get Prometheus metrics', error);
      throw error;
    }
  }

  @Get('version')
  @ApiOperation({ summary: 'Application version information' })
  @ApiResponse({ status: 200, description: 'Version information' })
  getVersion(): {
    version: string;
    environment: string;
    buildTime?: string;
    gitCommit?: string;
    nodeVersion: string;
  } {
    return {
      version: process.env.npm_package_version || '1.0.0',
      environment: process.env.NODE_ENV || 'development',
      buildTime: process.env.BUILD_TIME,
      gitCommit: process.env.GIT_COMMIT,
      nodeVersion: process.version,
    };
  }

  @Get('status')
  @ApiOperation({ summary: 'Simple status endpoint' })
  @ApiResponse({ status: 200, description: 'Service status' })
  getStatus(): {
    status: string;
    timestamp: string;
    uptime: number;
    environment: string;
  } {
    return {
      status: 'running',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      environment: process.env.NODE_ENV || 'development',
    };
  }
}
