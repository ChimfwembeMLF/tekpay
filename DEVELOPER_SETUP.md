# TekPay Gateway - Developer Setup Guide

This guide will help you set up the TekPay Gateway for development and testing.

## Prerequisites

Before you begin, ensure you have the following installed:

- **Node.js** (v18 or higher)
- **PostgreSQL** (v13 or higher)
- **Redis** (v6 or higher)
- **Git**
- **npm** or **yarn**

## Quick Start

### 1. Clone and Install Dependencies

```bash
git clone <repository-url>
cd tekpay-gateway
npm install
```

### 2. Environment Setup

```bash
# Copy the example environment file
cp .env.example .env

# Edit the .env file with your configuration
nano .env
```

**Required Environment Variables:**

```bash
# Database
DATABASE_HOST=localhost
DATABASE_PORT=5432
DATABASE_NAME=tekpay_gateway
DATABASE_USERNAME=postgres
DATABASE_PASSWORD=your_password

# Redis
REDIS_HOST=localhost
REDIS_PORT=6379

# JWT Secret (generate a secure 32+ character string)
JWT_SECRET=your-super-secret-jwt-key-change-in-production-min-32-chars

# Webhook Secret (generate a secure 32+ character string)
WEBHOOK_SECRET=your-webhook-secret-key-min-32-chars-for-signature-verification

# MTN Mobile Money (get from MTN Developer Portal)
MTN_CLIENT_ID=your_mtn_client_id
MTN_CLIENT_SECRET=your_mtn_client_secret
MTN_SUBSCRIPTION_KEY=your_mtn_subscription_key

# Airtel Money (get from Airtel Developer Portal)
AIRTEL_CLIENT_ID=your_airtel_client_id
AIRTEL_CLIENT_SECRET=your_airtel_client_secret
```

### 3. Database Setup

```bash
# Create the database
createdb tekpay_gateway

# Run migrations
npm run migration:run

# Seed with initial data
npm run seed:run
```

### 4. Start the Application

```bash
# Development mode (with hot reload)
npm run start:dev

# Production mode
npm run build
npm run start:prod
```

The application will be available at:
- **API**: http://localhost:3000/api
- **Admin Dashboard**: http://localhost:3000
- **API Documentation**: http://localhost:3000/api/docs

## Development Workflow

### Database Management

```bash
# Generate a new migration
npm run migration:generate src/database/migrations/YourMigrationName

# Create an empty migration
npm run migration:create src/database/migrations/YourMigrationName

# Run pending migrations
npm run migration:run

# Revert the last migration
npm run migration:revert

# Show migration status
npm run migration:show

# Reset database (revert all + run all + seed)
npm run db:reset
```

### Testing

```bash
# Run all tests
npm test

# Run tests in watch mode
npm run test:watch

# Run tests with coverage
npm run test:cov

# Run specific test file
npm test -- payments.service.spec.ts

# Run integration tests only
npm test -- --testPathPattern=controller.spec.ts
```

### Code Quality

```bash
# Lint code
npm run lint

# Format code
npm run format

# Type checking
npm run build
```

## API Testing

### Using the Demo Consumers

After running the seed script, you'll have demo API consumers available:

```bash
# Basic Plan Consumer
API Key: tk_[generated_key]
Email: demo-basic@tekpay.com

# Standard Plan Consumer  
API Key: tk_[generated_key]
Email: demo-standard@tekpay.com

# Premium Plan Consumer
API Key: tk_[generated_key]
Email: demo-premium@tekpay.com

# Enterprise Plan Consumer
API Key: tk_[generated_key]
Email: demo-enterprise@tekpay.com
```

Check the console output after running `npm run seed:run` for the actual API keys.

### Example API Calls

```bash
# Create a payment
curl -X POST http://localhost:3000/api/v1/payments \
  -H "Content-Type: application/json" \
  -H "X-API-Key: your-api-key" \
  -d '{
    "amount": 1000,
    "mno": "MTN",
    "phoneNumber": "260976123456",
    "externalReference": "ORDER-123",
    "callbackUrl": "https://your-site.com/webhook"
  }'

# Get payment details
curl -H "X-API-Key: your-api-key" \
  http://localhost:3000/api/v1/payments/{payment-id}

# List payments
curl -H "X-API-Key: your-api-key" \
  "http://localhost:3000/api/v1/payments?status=completed&limit=10"
```

## MNO Integration Setup

### MTN Mobile Money

1. Register at [MTN Developer Portal](https://momodeveloper.mtn.com/)
2. Create a new application
3. Get your credentials:
   - Client ID
   - Client Secret
   - Subscription Key
4. Update your `.env` file with the credentials

### Airtel Money

1. Register at [Airtel Developer Portal](https://developers.airtel.africa/)
2. Create a new application
3. Get your credentials:
   - Client ID
   - Client Secret
4. Update your `.env` file with the credentials

## Troubleshooting

### Common Issues

**Database Connection Error:**
```bash
# Check if PostgreSQL is running
sudo systemctl status postgresql

# Check if database exists
psql -l | grep tekpay_gateway
```

**Redis Connection Error:**
```bash
# Check if Redis is running
sudo systemctl status redis

# Test Redis connection
redis-cli ping
```

**Migration Errors:**
```bash
# Check migration status
npm run migration:show

# If stuck, reset database
npm run db:reset
```

**Test Failures:**
```bash
# Ensure test database exists
createdb tekpay_gateway_test

# Run tests with verbose output
npm test -- --verbose
```

### Environment-Specific Issues

**Development:**
- Ensure `DATABASE_SYNCHRONIZE=true` in development
- Use `LOG_LEVEL=debug` for detailed logging

**Testing:**
- Use separate test database
- Ensure Redis DB 1 is available for tests
- Check `.env.test` configuration

**Production:**
- Never use `DATABASE_SYNCHRONIZE=true`
- Use proper SSL certificates
- Set strong JWT and webhook secrets
- Configure proper CORS origins

## Project Structure

```
src/
├── admin/           # Admin dashboard endpoints
├── auth/            # Authentication & API consumers
├── audit/           # Audit logging
├── billing/         # Usage tracking & billing
├── common/          # Shared utilities & decorators
├── database/        # Migrations & seeds
├── jobs/            # Background job processors
├── mno/             # MNO provider integrations
├── payments/        # Core payment functionality
├── test/            # Test utilities & setup
└── webhooks/        # Webhook handling
```

## Contributing

1. Create a feature branch
2. Make your changes
3. Add tests for new functionality
4. Ensure all tests pass
5. Update documentation if needed
6. Submit a pull request

## Support

For development support:
- Check the API documentation at `/api/docs`
- Review the test files for usage examples
- Check the improvement log for recent changes
- Create an issue for bugs or feature requests
