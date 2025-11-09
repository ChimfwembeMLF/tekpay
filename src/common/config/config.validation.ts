import { plainToClass, Transform } from 'class-transformer';
import {
  IsString,
  IsNumber,
  IsBoolean,
  IsOptional,
  IsEnum,
  IsUrl,
  Min,
  Max,
  validateSync,
  MinLength,
} from 'class-validator';

enum Environment {
  Development = 'development',
  Production = 'production',
  Test = 'test',
}

enum LogLevel {
  Error = 'error',
  Warn = 'warn',
  Info = 'info',
  Debug = 'debug',
}

export class EnvironmentVariables {
  // Application Configuration
  @IsEnum(Environment)
  NODE_ENV: Environment = Environment.Development;

  @IsNumber()
  @Min(1)
  @Max(65535)
  @Transform(({ value }) => parseInt(value, 10))
  PORT: number = 3000;

  // Database Configuration
  @IsString()
  DATABASE_HOST: string;

  @IsNumber()
  @Min(1)
  @Max(65535)
  @Transform(({ value }) => parseInt(value, 10))
  DATABASE_PORT: number = 5432;

  @IsString()
  DATABASE_NAME: string;

  @IsString()
  DATABASE_USERNAME: string;

  @IsString()
  DATABASE_PASSWORD: string;

  @IsBoolean()
  @IsOptional()
  @Transform(({ value }) => value === 'true')
  DATABASE_SSL?: boolean = false;

  @IsBoolean()
  @IsOptional()
  @Transform(({ value }) => value === 'true')
  DATABASE_SYNCHRONIZE?: boolean = false;

  @IsBoolean()
  @IsOptional()
  @Transform(({ value }) => value === 'true')
  DATABASE_LOGGING?: boolean = false;

  // Redis Configuration
  @IsString()
  REDIS_HOST: string;

  @IsNumber()
  @Min(1)
  @Max(65535)
  @Transform(({ value }) => parseInt(value, 10))
  REDIS_PORT: number = 6379;

  @IsString()
  @IsOptional()
  REDIS_PASSWORD?: string;

  @IsNumber()
  @IsOptional()
  @Min(0)
  @Max(15)
  @Transform(({ value }) => parseInt(value, 10))
  REDIS_DB?: number = 0;

  // JWT Configuration
  @IsString()
  @MinLength(32, { message: 'JWT_SECRET must be at least 32 characters long' })
  JWT_SECRET: string;

  @IsString()
  JWT_EXPIRES_IN: string = '24h';

  // MTN Configuration
  @IsUrl()
  MTN_BASE_URL: string;

  @IsString()
  MTN_CLIENT_ID: string;

  @IsString()
  MTN_CLIENT_SECRET: string;

  @IsString()
  MTN_SUBSCRIPTION_KEY: string;

  @IsOptional()
  // @IsUrl({}, { message: 'MTN_CALLBACK_HOST must be a URL address' })
  MTN_CALLBACK_HOST?: string;

  @IsString()
  @IsOptional()
  MTN_ENVIRONMENT?: string = 'sandbox';

  @IsString()
  @IsOptional()
  MTN_CURRENCY?: string = 'ZMW';

  @IsString()
  @IsOptional()
  MTN_COUNTRY?: string = 'ZM';

  // Airtel Configuration
  @IsUrl()
  AIRTEL_BASE_URL: string;

  @IsString()
  AIRTEL_CLIENT_ID: string;

  @IsString()
  AIRTEL_CLIENT_SECRET: string;

  @IsOptional()
  // @IsUrl({}, { message: 'AIRTEL_CALLBACK_HOST must be a URL address' })
  AIRTEL_CALLBACK_HOST?: string;

  @IsString()
  @IsOptional()
  AIRTEL_ENVIRONMENT?: string = 'sandbox';

  @IsString()
  @IsOptional()
  AIRTEL_CURRENCY?: string = 'ZMW';

  @IsString()
  @IsOptional()
  AIRTEL_COUNTRY?: string = 'ZM';

  // Webhook Configuration
  @IsOptional()
  // @IsUrl({}, { message: 'WEBHOOK_BASE_URL must be a URL address' })
  WEBHOOK_BASE_URL?: string;

  @IsString()
  @MinLength(32, { message: 'WEBHOOK_SECRET must be at least 32 characters long' })
  WEBHOOK_SECRET: string;

  @IsNumber()
  @IsOptional()
  @Min(1)
  @Max(10)
  @Transform(({ value }) => parseInt(value, 10))
  WEBHOOK_RETRY_ATTEMPTS?: number = 3;

  @IsNumber()
  @IsOptional()
  @Min(1000)
  @Transform(({ value }) => parseInt(value, 10))
  WEBHOOK_RETRY_DELAY?: number = 5000;

  @IsNumber()
  @IsOptional()
  @Min(1000)
  @Transform(({ value }) => parseInt(value, 10))
  WEBHOOK_TIMEOUT?: number = 10000;

  // Security Configuration
  @IsString()
  @IsOptional()
  CORS_ORIGIN?: string = '*';

  @IsBoolean()
  @IsOptional()
  @Transform(({ value }) => value === 'true')
  CORS_CREDENTIALS?: boolean = true;

  @IsNumber()
  @IsOptional()
  @Min(60000)
  @Transform(({ value }) => parseInt(value, 10))
  RATE_LIMIT_WINDOW_MS?: number = 900000;

  @IsNumber()
  @IsOptional()
  @Min(1)
  @Transform(({ value }) => parseInt(value, 10))
  RATE_LIMIT_MAX_REQUESTS?: number = 1000;

  // Logging Configuration
  @IsEnum(LogLevel)
  @IsOptional()
  LOG_LEVEL?: LogLevel = LogLevel.Info;

  @IsString()
  @IsOptional()
  LOG_FORMAT?: string = 'json';

  @IsBoolean()
  @IsOptional()
  @Transform(({ value }) => value === 'true')
  LOG_FILE_ENABLED?: boolean = false;

  // Business Configuration
  @IsString()
  @IsOptional()
  DEFAULT_PRICING_PLAN?: string = 'standard';

  @IsNumber()
  @IsOptional()
  @Min(1)
  @Transform(({ value }) => parseInt(value, 10))
  DEFAULT_MONTHLY_QUOTA?: number = 10000;

  @IsNumber()
  @IsOptional()
  @Min(1)
  @Max(60)
  @Transform(({ value }) => parseInt(value, 10))
  PAYMENT_EXPIRY_MINUTES?: number = 15;

  @IsString()
  @IsOptional()
  PAYMENT_CURRENCY?: string = 'ZMW';

  @IsNumber()
  @IsOptional()
  @Min(1)
  @Transform(({ value }) => parseFloat(value))
  PAYMENT_MIN_AMOUNT?: number = 1;

  @IsNumber()
  @IsOptional()
  @Min(1)
  @Transform(({ value }) => parseFloat(value))
  PAYMENT_MAX_AMOUNT?: number = 50000;

  // Development Configuration
  @IsBoolean()
  @IsOptional()
  @Transform(({ value }) => value === 'true')
  DEBUG?: boolean = false;

  @IsBoolean()
  @IsOptional()
  @Transform(({ value }) => value === 'true')
  SWAGGER_ENABLED?: boolean = true;

  @IsString()
  @IsOptional()
  SWAGGER_PATH?: string = 'api/docs';
}

export function validate(config: Record<string, unknown>) {
  const validatedConfig = plainToClass(EnvironmentVariables, config, {
    enableImplicitConversion: true,
  });

  const errors = validateSync(validatedConfig, {
    skipMissingProperties: false,
  });

  if (errors.length > 0) {
    const errorMessages = errors.map((error) => {
      const constraints = Object.values(error.constraints || {});
      return `${error.property}: ${constraints.join(', ')}`;
    });

    throw new Error(`Configuration validation failed:\n${errorMessages.join('\n')}`);
  }

  return validatedConfig;
}

export default validate;
