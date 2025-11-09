# TekPay Gateway

A comprehensive Mobile Money Payment Gateway for MTN and Airtel in Zambia (ZMW), built with NestJS, PostgreSQL, and TypeORM.

## Features

### Core Payment Processing
- **Multi-MNO Support**: Integrated with MTN and Airtel Mobile Money APIs
- **Complete Payment Lifecycle**: Created → Initiated → Pending → Completed → Settled → Refunded
- **Idempotent APIs**: Prevent duplicate transactions with idempotency keys
- **Webhook Handling**: Secure webhook processing with signature verification
- **Background Jobs**: Asynchronous processing with BullMQ and Redis

### API Consumer Management
- **API Key Authentication**: Secure API access with unique keys per consumer
- **Usage-based Billing**: Track API calls and transaction volume
- **Flexible Pricing Plans**: Basic, Standard, Premium, and Enterprise tiers
- **Rate Limiting**: Prevent API abuse with configurable limits
- **Quota Management**: Monthly API call quotas with overage tracking

### Security & Compliance
- **End-to-end Encryption**: TLS 1.2+ for all communications
- **Webhook Signature Verification**: HMAC-SHA256 signature validation
- **Comprehensive Audit Logging**: Track all financial operations
- **Role-based Access**: Admin and consumer access controls
- **PCI Compliance Ready**: Secure handling of payment data

### Monitoring & Operations
- **Real-time Dashboard**: Vue.js admin interface with live statistics
- **Payment Analytics**: Trends, success rates, and volume reporting
- **Automated Reconciliation**: Daily settlement verification
- **Alert System**: Configurable alerts for failures and discrepancies
- **Health Monitoring**: System health and performance metrics

## Quick Start

### Prerequisites
- Node.js 18+ 
- PostgreSQL 13+
- Redis 6+

### Installation

1. **Clone and Install**
```bash
git clone <repository>
cd tekpay-gateway
npm install
```

2. **Environment Setup**
```bash
cp .env.example .env
# Edit .env with your database and MNO credentials
```

3. **Database Setup**
```bash
# Create database
createdb tekpay_gateway

# Database will auto-migrate on first run in development
```

4. **Start Services**
```bash
# Development mode
npm run start:dev

# Production mode
npm run build
npm run start:prod
```

## API Documentation

### Authentication
All API endpoints require authentication via `X-API-Key` header:

```bash
curl -H "X-API-Key: your-api-key" https://api.tekpay.com/api/v1/payments
```

### Core Endpoints

#### Create Payment
```http
POST /api/v1/payments
Content-Type: application/json
X-API-Key: your-api-key
Idempotency-Key: unique-request-id

{
  "amount": 1000.00,
  "mno": "MTN",
  "phoneNumber": "260976123456",
  "externalReference": "ORDER-123",
  "callbackUrl": "https://your-site.com/webhook"
}
```

#### Check Payment Status
```http
GET /api/v1/payments/{payment-id}
X-API-Key: your-api-key
```

#### List Payments
```http
GET /api/v1/payments?status=completed&limit=50
X-API-Key: your-api-key
```

#### Request Refund
```http
POST /api/v1/payments/{payment-id}/refund
Content-Type: application/json
X-API-Key: your-api-key

{
  "amount": 500.00,
  "reason": "Customer requested refund"
}
```

### Webhook Integration

Configure webhook endpoints in your MNO dashboard:
- **MTN**: `https://your-domain.com/webhooks/mtn`
- **Airtel**: `https://your-domain.com/webhooks/airtel`

Webhooks are signed with HMAC-SHA256. Verify signatures:

```javascript
const crypto = require('crypto');

function verifyWebhook(payload, signature, secret) {
  const expectedSignature = crypto
    .createHmac('sha256', secret)
    .update(payload)
    .digest('hex');
  
  return signature === `sha256=${expectedSignature}`;
}
```

## MNO Integration

### MTN Mobile Money
```javascript
// Sandbox Configuration
MTN_BASE_URL=https://sandbox.momodeveloper.mtn.com
MTN_CLIENT_ID=your-client-id
MTN_CLIENT_SECRET=your-client-secret
MTN_SUBSCRIPTION_KEY=your-subscription-key
```

### Airtel Money
```javascript
// Sandbox Configuration  
AIRTEL_BASE_URL=https://openapiuat.airtel.africa
AIRTEL_CLIENT_ID=your-client-id
AIRTEL_CLIENT_SECRET=your-client-secret
```

## Admin Dashboard

Access the admin dashboard at `http://localhost:3000` to:

- Monitor payment statistics and trends
- View transaction details and status
- Manage API consumers and quotas
- Track usage and billing information
- Configure system settings

### Dashboard Features
- **Real-time Statistics**: Payment volumes, success rates, active consumers
- **Payment Search**: Filter by status, MNO, phone number, amount, date range
- **Consumer Management**: Create API consumers, set quotas, view usage
- **System Monitoring**: Health checks, audit logs, error tracking

## Billing & Pricing

### Pricing Tiers
- **Basic**: ZMW 0.01/call, 0.1% volume fee
- **Standard**: ZMW 0.008/call, 0.08% volume fee  
- **Premium**: ZMW 0.006/call, 0.06% volume fee
- **Enterprise**: ZMW 0.004/call, 0.04% volume fee

### Usage Tracking
```http
GET /api/v1/usage
X-API-Key: your-api-key

{
  "billingPeriod": "2024-01",
  "apiCalls": 1250,
  "totalVolume": 125000.00,
  "charges": 1250.00,
  "plan": "standard",
  "quotaUsagePercentage": 12.5
}
```

## Deployment

### Docker Deployment
```dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY dist ./dist
EXPOSE 3000
CMD ["node", "dist/main"]
```

### Environment Variables
```bash
# Production Configuration
NODE_ENV=production
PORT=3000
DATABASE_URL=postgresql://user:pass@host:5432/db
REDIS_URL=redis://host:6379
JWT_SECRET=your-super-secret-key
WEBHOOK_SECRET=webhook-signing-secret
```

### Health Checks
```http
GET /api/health
GET /api/version
```

## Security Considerations

1. **API Keys**: Generate strong, unique keys for each consumer
2. **Rate Limiting**: Configure appropriate limits per pricing tier
3. **Webhook Verification**: Always verify webhook signatures
4. **Database Security**: Use SSL connections, encrypt at rest
5. **Monitoring**: Set up alerts for unusual patterns or failures
6. **Audit Logging**: Maintain comprehensive transaction logs
7. **Access Controls**: Implement principle of least privilege

## Support

For technical support and integration assistance:

- **Documentation**: `http://localhost:3000/api/docs` (Swagger)
- **Support Email**: support@tekrem.com
- **Phone**: +260 xxx xxx xxx
- **Business Hours**: Mon-Fri 8AM-6PM CAT

## License

Copyright © 2024 Tekrem Innovation Solutions. All rights reserved.