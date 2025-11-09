# TekPay Admin API Documentation

## Overview

The TekPay Admin API provides comprehensive back-office functionality for managing clients, monitoring payments, and overseeing system health. All admin endpoints require JWT authentication with admin privileges.

## Base URL
```
https://api.tekpay.zm/admin
```

## Authentication
All admin endpoints require a Bearer token in the Authorization header:
```
Authorization: Bearer <admin_jwt_token>
```

---

## Dashboard & Analytics

### Get Dashboard Statistics
```http
GET /admin/dashboard?dateFrom=2024-09-01&dateTo=2024-09-30
```

**Response:**
```json
{
  "payments": {
    "total": 1247,
    "completed": 1089,
    "failed": 78,
    "pending": 80,
    "successRate": 87.5
  },
  "volume": {
    "total": 125750.50,
    "currency": "ZMW"
  },
  "consumers": {
    "active": 23
  },
  "period": {
    "from": "2024-09-01T00:00:00Z",
    "to": "2024-09-30T23:59:59Z"
  }
}
```

### Get Payment Trends
```http
GET /admin/trends?days=30
```

**Response:**
```json
[
  {
    "date": "2024-09-25",
    "count": 23,
    "volume": 2150.00,
    "completed": 20,
    "failed": 3,
    "successRate": 86.96
  }
]
```

### Get Top Consumers
```http
GET /admin/top-consumers?limit=10
```

**Response:**
```json
[
  {
    "id": "consumer_123",
    "name": "Acme E-commerce",
    "email": "admin@acme.com",
    "pricingPlan": "professional",
    "paymentCount": 156,
    "totalVolume": 25000.00
  }
]
```

---

## Client Management

### Get All Clients
```http
GET /admin/clients?page=1&limit=20&search=acme&status=true
```

**Response:**
```json
{
  "clients": [
    {
      "id": "client_123",
      "name": "Acme E-commerce Ltd",
      "email": "admin@acme.com",
      "description": "E-commerce platform",
      "webhookUrl": "https://api.acme.com/webhooks/tekpay",
      "apiKey": "tek_live_xxx***xxx1234",
      "pricingPlan": "professional",
      "isActive": true,
      "contactInfo": "+260971234567",
      "address": "Lusaka, Zambia",
      "createdAt": "2024-01-15T10:30:00Z",
      "updatedAt": "2024-09-25T14:20:00Z",
      "lastActivityAt": "2024-09-25T12:00:00Z",
      "totalPayments": 156,
      "totalVolume": 25000.00,
      "successRate": 89.5
    }
  ],
  "total": 23,
  "page": 1,
  "totalPages": 2
}
```

### Get Client by ID
```http
GET /admin/clients/{clientId}
```

### Create New Client
```http
POST /admin/clients
Content-Type: application/json

{
  "name": "New Client Ltd",
  "email": "admin@newclient.com",
  "description": "New client description",
  "webhookUrl": "https://api.newclient.com/webhooks/tekpay",
  "pricingPlan": "starter",
  "contactInfo": "+260971234567",
  "address": "Lusaka, Zambia"
}
```

**Response:**
```json
{
  "id": "client_456",
  "name": "New Client Ltd",
  "email": "admin@newclient.com",
  "apiKey": "tek_live_abcd1234567890efgh",
  "pricingPlan": "starter",
  "isActive": true,
  "createdAt": "2024-09-25T15:30:00Z"
}
```

### Update Client
```http
PUT /admin/clients/{clientId}
Content-Type: application/json

{
  "name": "Updated Client Name",
  "pricingPlan": "professional"
}
```

### Update Client Status
```http
PUT /admin/clients/{clientId}/status
Content-Type: application/json

{
  "isActive": false
}
```

### Delete Client (Soft Delete)
```http
DELETE /admin/clients/{clientId}
```

### Regenerate API Key
```http
POST /admin/clients/{clientId}/regenerate-api-key
```

**Response:**
```json
{
  "apiKey": "tek_live_new1234567890abcdef"
}
```

---

## Client Analytics

### Get Client Analytics
```http
GET /admin/clients/{clientId}/analytics?dateFrom=2024-09-01&dateTo=2024-09-30
```

**Response:**
```json
{
  "client": { /* client details */ },
  "paymentStats": {
    "total": 156,
    "completed": 140,
    "failed": 12,
    "pending": 4,
    "successRate": 89.74
  },
  "volumeStats": {
    "total": 25000.00,
    "currency": "ZMW",
    "averageTransaction": 160.26
  },
  "mnoDistribution": {
    "mtn": 98,
    "airtel": 58
  },
  "dailyTrends": [
    {
      "date": "2024-09-25",
      "count": 5,
      "volume": 750.00,
      "successRate": 100.0
    }
  ],
  "billing": {
    "currentMonth": 125.50,
    "previousMonth": 98.75,
    "totalCost": 224.25
  }
}
```

### Get Client Usage
```http
GET /admin/clients/{clientId}/usage?month=2024-09
```

**Response:**
```json
{
  "month": 9,
  "year": 2024,
  "apiCalls": 1250,
  "successfulTransactions": 140,
  "failedTransactions": 12,
  "totalCost": 125.50,
  "breakdown": {
    "apiCallCost": 25.00,
    "transactionCost": 98.00,
    "additionalFees": 2.50
  }
}
```

### Get Client Payments
```http
GET /admin/clients/{clientId}/payments?page=1&limit=20&status=COMPLETED
```

---

## Payment Search

### Search Payments
```http
GET /admin/payments/search?status=COMPLETED&mno=MTN&amountMin=100&amountMax=1000&dateFrom=2024-09-01&dateTo=2024-09-30&limit=50&offset=0
```

**Query Parameters:**
- `status`: PENDING, COMPLETED, FAILED, EXPIRED, CANCELLED
- `mno`: MTN, AIRTEL
- `consumerId`: Client UUID
- `phoneNumber`: Phone number (partial match)
- `amountMin`: Minimum amount
- `amountMax`: Maximum amount
- `dateFrom`: Start date (ISO 8601)
- `dateTo`: End date (ISO 8601)
- `limit`: Results per page (default: 50)
- `offset`: Results offset (default: 0)

---

## System Monitoring

### Get System Health
```http
GET /admin/system/health
```

**Response:**
```json
{
  "status": "healthy",
  "timestamp": "2024-09-25T15:30:00Z",
  "metrics": {
    "recentPayments": 23,
    "activeConsumers": 15,
    "recentFailures": 2,
    "successRate": 91.3
  },
  "issues": [],
  "uptime": 86400
}
```

### Get System Metrics
```http
GET /admin/system/metrics?hours=24
```

**Response:**
```json
{
  "period": {
    "from": "2024-09-24T15:30:00Z",
    "to": "2024-09-25T15:30:00Z",
    "hours": 24
  },
  "hourlyMetrics": [
    {
      "hour": 14,
      "totalPayments": 12,
      "successfulPayments": 11,
      "failedPayments": 1,
      "averageAmount": 185.50,
      "successRate": 91.67
    }
  ],
  "responseTime": {
    "average": 250,
    "p95": 500,
    "p99": 1000
  },
  "errors": [
    {
      "errorCode": "INSUFFICIENT_FUNDS",
      "count": 5
    }
  ]
}
```

### Get Alerts
```http
GET /admin/alerts?severity=high&limit=50
```

**Response:**
```json
[
  {
    "id": "high-failure-rate",
    "severity": "high",
    "title": "High Failure Rate Detected",
    "message": "8 failed payments in the last hour",
    "timestamp": "2024-09-25T15:25:00Z",
    "resolved": false
  }
]
```

---

## Error Responses

All endpoints return standard HTTP status codes:

- `200`: Success
- `201`: Created
- `400`: Bad Request
- `401`: Unauthorized
- `403`: Forbidden
- `404`: Not Found
- `500`: Internal Server Error

**Error Response Format:**
```json
{
  "statusCode": 400,
  "message": "Validation failed",
  "error": "Bad Request",
  "details": [
    {
      "field": "email",
      "message": "Email must be a valid email address"
    }
  ]
}
```

---

## Rate Limiting

Admin endpoints are rate-limited to:
- 1000 requests per hour per admin user
- 100 requests per minute per admin user

Rate limit headers are included in responses:
```
X-RateLimit-Limit: 1000
X-RateLimit-Remaining: 999
X-RateLimit-Reset: 1695654000
```
