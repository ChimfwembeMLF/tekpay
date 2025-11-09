import { Module, Global } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { APP_GUARD, APP_INTERCEPTOR } from '@nestjs/core';
import { LoggerService } from './services/logger.service';
import { HealthService } from './services/health.service';
import { MetricsService } from './services/metrics.service';
import { PerformanceService } from './services/performance.service';
import { MonitoringController } from './controllers/monitoring.controller';
import { SecurityGuard } from './guards/security.guard';
import { ErrorHandlingInterceptor } from './interceptors/error-handling.interceptor';
import { RequestLoggingInterceptor } from './interceptors/request-logging.interceptor';

@Global()
@Module({
  imports: [HttpModule],
  providers: [
    LoggerService,
    HealthService,
    MetricsService,
    PerformanceService,
    SecurityGuard,
    {
      provide: APP_GUARD,
      useClass: SecurityGuard,
    },
    {
      provide: APP_INTERCEPTOR,
      useClass: RequestLoggingInterceptor,
    },
    {
      provide: APP_INTERCEPTOR,
      useClass: ErrorHandlingInterceptor,
    },
  ],
  controllers: [MonitoringController],
  exports: [
    LoggerService,
    HealthService,
    MetricsService,
    PerformanceService,
    SecurityGuard,
  ],
})
export class CommonModule {}
