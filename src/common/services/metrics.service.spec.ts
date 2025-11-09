import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { MetricsService } from './metrics.service';
import { LoggerService } from './logger.service';

describe('MetricsService', () => {
  let service: MetricsService;
  let loggerService: LoggerService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        MetricsService,
        {
          provide: ConfigService,
          useValue: {
            get: jest.fn((key: string, defaultValue?: any) => {
              const config = {
                METRICS_ENABLED: 'true',
              };
              return config[key] || defaultValue;
            }),
          },
        },
        {
          provide: LoggerService,
          useValue: {
            debug: jest.fn(),
            log: jest.fn(),
            error: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<MetricsService>(MetricsService);
    loggerService = module.get<LoggerService>(LoggerService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('Counter metrics', () => {
    it('should increment counter', () => {
      service.incrementCounter('test.counter', 1);
      
      const counter = service.getCounter('test.counter');
      expect(counter).toBeDefined();
      expect(counter.count).toBe(1);
    });

    it('should increment counter with tags', () => {
      service.incrementCounter('test.counter', 1, { type: 'test' });
      
      const counter = service.getCounter('test.counter', { type: 'test' });
      expect(counter).toBeDefined();
      expect(counter.count).toBe(1);
    });

    it('should increment counter multiple times', () => {
      service.incrementCounter('test.counter', 1);
      service.incrementCounter('test.counter', 2);
      
      const counter = service.getCounter('test.counter');
      expect(counter.count).toBe(3);
    });
  });

  describe('Gauge metrics', () => {
    it('should set gauge value', () => {
      service.setGauge('test.gauge', 100);
      
      const gauge = service.getGauge('test.gauge');
      expect(gauge).toBeDefined();
      expect(gauge.value).toBe(100);
    });

    it('should update gauge value', () => {
      service.setGauge('test.gauge', 100);
      service.setGauge('test.gauge', 200);
      
      const gauge = service.getGauge('test.gauge');
      expect(gauge.value).toBe(200);
    });
  });

  describe('Histogram metrics', () => {
    it('should record histogram values', () => {
      service.recordHistogram('test.histogram', 50);
      service.recordHistogram('test.histogram', 100);
      
      const histogram = service.getHistogram('test.histogram');
      expect(histogram).toBeDefined();
      expect(histogram.count).toBe(2);
      expect(histogram.sum).toBe(150);
      expect(histogram.min).toBe(50);
      expect(histogram.max).toBe(100);
    });
  });

  describe('Timer metrics', () => {
    it('should record timer duration', () => {
      service.recordTimer('test.timer', 100);
      service.recordTimer('test.timer', 200);
      
      const timer = service.getTimer('test.timer');
      expect(timer).toBeDefined();
      expect(timer.count).toBe(2);
      expect(timer.totalTime).toBe(300);
      expect(timer.avgTime).toBe(150);
      expect(timer.minTime).toBe(100);
      expect(timer.maxTime).toBe(200);
    });

    it('should start and stop timer', (done) => {
      const stopTimer = service.startTimer('test.timer');

      // Simulate some work
      setTimeout(() => {
        stopTimer();

        const timer = service.getTimer('test.timer');
        expect(timer).toBeDefined();
        expect(timer.count).toBe(1);
        expect(timer.totalTime).toBeGreaterThan(0);
        done();
      }, 10);
    });
  });

  describe('Business metrics', () => {
    it('should record payment created', () => {
      service.recordPaymentCreated('MTN', 1000);
      
      const counter = service.getCounter('payments.created.total', { mno: 'MTN' });
      expect(counter).toBeDefined();
      expect(counter.count).toBe(1);
    });

    it('should record payment completed', () => {
      service.recordPaymentCompleted('MTN', 1000, 500);
      
      const counter = service.getCounter('payments.completed.total', { mno: 'MTN' });
      expect(counter).toBeDefined();
      expect(counter.count).toBe(1);
    });

    it('should record payment failed', () => {
      service.recordPaymentFailed('MTN', 'insufficient_funds');
      
      const counter = service.getCounter('payments.failed.total', { mno: 'MTN', reason: 'insufficient_funds' });
      expect(counter).toBeDefined();
      expect(counter.count).toBe(1);
    });

    it('should record API call', () => {
      service.recordApiCall('POST', '/api/v1/payments', 201, 150);
      
      const counter = service.getCounter('api.requests.total', { 
        method: 'POST', 
        endpoint: '/api/v1/payments', 
        status: '201' 
      });
      expect(counter).toBeDefined();
      expect(counter.count).toBe(1);
    });
  });

  describe('Export methods', () => {
    it('should export all metrics', () => {
      service.incrementCounter('test.counter', 1);
      service.setGauge('test.gauge', 100);
      service.recordHistogram('test.histogram', 50);
      service.recordTimer('test.timer', 100);
      
      const metrics = service.getAllMetrics();
      
      expect(metrics.counters).toBeDefined();
      expect(metrics.gauges).toBeDefined();
      expect(metrics.histograms).toBeDefined();
      expect(metrics.timers).toBeDefined();
    });

    it('should export Prometheus metrics', () => {
      service.incrementCounter('test.counter', 1);
      service.setGauge('test.gauge', 100);
      
      const prometheus = service.getPrometheusMetrics();
      
      expect(prometheus).toContain('# TYPE test.counter counter');
      expect(prometheus).toContain('test.counter 1');
      expect(prometheus).toContain('# TYPE test.gauge gauge');
      expect(prometheus).toContain('test.gauge 100');
    });
  });

  describe('Cleanup', () => {
    it('should cleanup old metrics', (done) => {
      service.incrementCounter('test.counter', 1);

      // Wait a bit then cleanup with very small max age
      setTimeout(() => {
        service.cleanup(1); // 1ms max age

        const counter = service.getCounter('test.counter');
        expect(counter).toBeUndefined();
        done();
      }, 10);
    });
  });
});
