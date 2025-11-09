declare enum Environment {
    Development = "development",
    Production = "production",
    Test = "test"
}
declare enum LogLevel {
    Error = "error",
    Warn = "warn",
    Info = "info",
    Debug = "debug"
}
export declare class EnvironmentVariables {
    NODE_ENV: Environment;
    PORT: number;
    DATABASE_HOST: string;
    DATABASE_PORT: number;
    DATABASE_NAME: string;
    DATABASE_USERNAME: string;
    DATABASE_PASSWORD: string;
    DATABASE_SSL?: boolean;
    DATABASE_SYNCHRONIZE?: boolean;
    DATABASE_LOGGING?: boolean;
    REDIS_HOST: string;
    REDIS_PORT: number;
    REDIS_PASSWORD?: string;
    REDIS_DB?: number;
    JWT_SECRET: string;
    JWT_EXPIRES_IN: string;
    MTN_BASE_URL: string;
    MTN_CLIENT_ID: string;
    MTN_CLIENT_SECRET: string;
    MTN_SUBSCRIPTION_KEY: string;
    MTN_CALLBACK_HOST?: string;
    MTN_ENVIRONMENT?: string;
    MTN_CURRENCY?: string;
    MTN_COUNTRY?: string;
    AIRTEL_BASE_URL: string;
    AIRTEL_CLIENT_ID: string;
    AIRTEL_CLIENT_SECRET: string;
    AIRTEL_CALLBACK_HOST?: string;
    AIRTEL_ENVIRONMENT?: string;
    AIRTEL_CURRENCY?: string;
    AIRTEL_COUNTRY?: string;
    WEBHOOK_BASE_URL?: string;
    WEBHOOK_SECRET: string;
    WEBHOOK_RETRY_ATTEMPTS?: number;
    WEBHOOK_RETRY_DELAY?: number;
    WEBHOOK_TIMEOUT?: number;
    CORS_ORIGIN?: string;
    CORS_CREDENTIALS?: boolean;
    RATE_LIMIT_WINDOW_MS?: number;
    RATE_LIMIT_MAX_REQUESTS?: number;
    LOG_LEVEL?: LogLevel;
    LOG_FORMAT?: string;
    LOG_FILE_ENABLED?: boolean;
    DEFAULT_PRICING_PLAN?: string;
    DEFAULT_MONTHLY_QUOTA?: number;
    PAYMENT_EXPIRY_MINUTES?: number;
    PAYMENT_CURRENCY?: string;
    PAYMENT_MIN_AMOUNT?: number;
    PAYMENT_MAX_AMOUNT?: number;
    DEBUG?: boolean;
    SWAGGER_ENABLED?: boolean;
    SWAGGER_PATH?: string;
}
export declare function validate(config: Record<string, unknown>): EnvironmentVariables;
export default validate;
