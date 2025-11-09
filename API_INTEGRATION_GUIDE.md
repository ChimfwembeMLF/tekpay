# TekPay Gateway - API Integration Guide

## 🚀 Quick Start

TekPay Gateway provides a simple, secure API for processing mobile money payments in Zambia via MTN and Airtel networks.

### Base URL
- **Sandbox**: `https://sandbox-api.tekpay.zm`
- **Production**: `https://api.tekpay.zm`

### Authentication
All API requests require an API key in the header:
```
X-API-Key: your_api_key_here
```

## 📋 **Getting Started**

### 1. Register Your Application
```bash
curl -X POST https://api.tekpay.zm/api/v1/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Your App Name",
    "email": "your@email.com",
    "description": "Brief description of your application",
    "webhookUrl": "https://yourapp.com/webhooks/tekpay"
  }'
```

### 2. Get Your API Key
After registration, you'll receive:
- `apiKey`: Your unique API key
- `consumerId`: Your consumer ID
- `webhookSecret`: Secret for webhook verification

## 💳 **Processing Payments**

### Create Payment
```bash
curl -X POST https://api.tekpay.zm/api/v1/payments \
  -H "Content-Type: application/json" \
  -H "X-API-Key: your_api_key" \
  -H "Idempotency-Key: unique_request_id" \
  -d '{
    "amount": 100.00,
    "currency": "ZMW",
    "phoneNumber": "260971234567",
    "mno": "MTN",
    "description": "Payment for Order #12345",
    "externalReference": "order_12345",
    "metadata": {
      "orderId": "12345",
      "customerId": "cust_789"
    }
  }'
```

**Response:**
```json
{
  "id": "pay_1234567890",
  "status": "PENDING",
  "amount": 100.00,
  "currency": "ZMW",
  "phoneNumber": "260971234567",
  "mno": "MTN",
  "description": "Payment for Order #12345",
  "externalReference": "order_12345",
  "createdAt": "2024-09-25T10:30:00Z",
  "expiresAt": "2024-09-25T11:00:00Z"
}
```

### Check Payment Status
```bash
curl -X GET https://api.tekpay.zm/api/v1/payments/pay_1234567890 \
  -H "X-API-Key: your_api_key"
```

### List Payments
```bash
curl -X GET "https://api.tekpay.zm/api/v1/payments?status=COMPLETED&limit=10" \
  -H "X-API-Key: your_api_key"
```

### Process Refund
```bash
curl -X POST https://api.tekpay.zm/api/v1/payments/pay_1234567890/refund \
  -H "Content-Type: application/json" \
  -H "X-API-Key: your_api_key" \
  -H "Idempotency-Key: unique_refund_id" \
  -d '{
    "amount": 50.00,
    "reason": "Partial refund requested by customer"
  }'
```

## 🔔 **Webhook Integration**

### Webhook Events
TekPay sends webhooks for these events:
- `payment.created`
- `payment.completed`
- `payment.failed`
- `payment.expired`
- `refund.completed`
- `refund.failed`

### Webhook Payload Example
```json
{
  "event": "payment.completed",
  "data": {
    "id": "pay_1234567890",
    "status": "COMPLETED",
    "amount": 100.00,
    "currency": "ZMW",
    "phoneNumber": "260971234567",
    "mno": "MTN",
    "externalReference": "order_12345",
    "completedAt": "2024-09-25T10:35:00Z",
    "mnoTransactionId": "mtn_tx_987654321"
  },
  "timestamp": "2024-09-25T10:35:00Z",
  "signature": "sha256=abc123..."
}
```

### Webhook Verification
```javascript
const crypto = require('crypto');

function verifyWebhook(payload, signature, secret) {
  const expectedSignature = crypto
    .createHmac('sha256', secret)
    .update(payload)
    .digest('hex');
  
  return `sha256=${expectedSignature}` === signature;
}

// Express.js example
app.post('/webhooks/tekpay', (req, res) => {
  const signature = req.headers['x-tekpay-signature'];
  const payload = JSON.stringify(req.body);
  
  if (!verifyWebhook(payload, signature, process.env.TEKPAY_WEBHOOK_SECRET)) {
    return res.status(401).send('Invalid signature');
  }
  
  const { event, data } = req.body;
  
  switch (event) {
    case 'payment.completed':
      // Handle successful payment
      console.log('Payment completed:', data.id);
      break;
    case 'payment.failed':
      // Handle failed payment
      console.log('Payment failed:', data.id);
      break;
  }
  
  res.status(200).send('OK');
});
```

## 📊 **Usage & Billing**

### Check Usage
```bash
curl -X GET https://api.tekpay.zm/api/v1/usage \
  -H "X-API-Key: your_api_key"
```

**Response:**
```json
{
  "period": "2024-09",
  "apiCalls": 1250,
  "totalVolume": 125000.00,
  "charges": 125.50,
  "quota": 10000,
  "remaining": 8750
}
```

## 🛡️ **Security Best Practices**

### 1. API Key Security
- Store API keys securely (environment variables)
- Never expose API keys in client-side code
- Rotate API keys regularly

### 2. Idempotency
- Always use `Idempotency-Key` header for payment requests
- Use unique identifiers (UUIDs recommended)
- Prevents duplicate payments

### 3. Webhook Security
- Always verify webhook signatures
- Use HTTPS endpoints only
- Implement proper error handling

### 4. Error Handling
```javascript
try {
  const response = await fetch('https://api.tekpay.zm/api/v1/payments', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-API-Key': process.env.TEKPAY_API_KEY,
      'Idempotency-Key': generateUUID()
    },
    body: JSON.stringify(paymentData)
  });
  
  if (!response.ok) {
    const error = await response.json();
    throw new Error(`Payment failed: ${error.message}`);
  }
  
  const payment = await response.json();
  return payment;
} catch (error) {
  console.error('Payment error:', error);
  // Handle error appropriately
}
```

## 📱 **Mobile Number Formats**

### Supported Formats
- **MTN**: `260976123456`, `260966123456`, `260956123456`
- **Airtel**: `260977123456`, `260967123456`, `260957123456`

### Auto-formatting
TekPay automatically formats phone numbers, but ensure they include the country code (260).

## 🧪 **Testing**

### Sandbox Environment
- Use sandbox API endpoint
- Test phone numbers: `260971111111` (MTN), `260977777777` (Airtel)
- All sandbox payments auto-complete after 30 seconds

### Test API Key
Contact support for sandbox API keys: support@tekpay.zm

## 📞 **Support**

- **Documentation**: https://docs.tekpay.zm
- **API Status**: https://status.tekpay.zm
- **Support Email**: support@tekpay.zm
- **Developer Slack**: https://tekpay-dev.slack.com

## 🔗 **SDKs & Libraries**

We provide official SDKs for popular languages:
- [JavaScript/Node.js SDK](./sdks/javascript/)
- [PHP SDK](./sdks/php/)
- [Python SDK](./sdks/python/)
- [C# SDK](./sdks/csharp/)

## 📈 **Rate Limits**

- **Default**: 1000 requests per 15 minutes per IP
- **Burst**: Up to 100 requests per minute
- **Enterprise**: Custom limits available

Rate limit headers:
```
X-RateLimit-Limit: 1000
X-RateLimit-Remaining: 999
X-RateLimit-Reset: 1632150000
```
