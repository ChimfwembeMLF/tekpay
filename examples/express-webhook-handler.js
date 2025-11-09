/**
 * TekPay Webhook Handler Example - Express.js
 * 
 * This example shows how to properly handle TekPay webhooks
 * in an Express.js application with proper security and error handling.
 */

const express = require('express');
const crypto = require('crypto');
const { TekPaySDK } = require('@tekpay/sdk');

const app = express();

// Middleware to capture raw body for webhook verification
app.use('/webhooks/tekpay', express.raw({ type: 'application/json' }));
app.use(express.json());

// Initialize TekPay SDK
const tekpay = new TekPaySDK(process.env.TEKPAY_API_KEY);

/**
 * Verify webhook signature
 */
function verifyWebhookSignature(payload, signature, secret) {
  const expectedSignature = crypto
    .createHmac('sha256', secret)
    .update(payload)
    .digest('hex');
  
  return `sha256=${expectedSignature}` === signature;
}

/**
 * TekPay webhook endpoint
 */
app.post('/webhooks/tekpay', async (req, res) => {
  try {
    // Get signature from headers
    const signature = req.headers['x-tekpay-signature'];
    if (!signature) {
      console.error('Missing webhook signature');
      return res.status(401).json({ error: 'Missing signature' });
    }

    // Verify webhook signature
    const isValid = verifyWebhookSignature(
      req.body,
      signature,
      process.env.TEKPAY_WEBHOOK_SECRET
    );

    if (!isValid) {
      console.error('Invalid webhook signature');
      return res.status(401).json({ error: 'Invalid signature' });
    }

    // Parse webhook payload
    const webhook = JSON.parse(req.body.toString());
    const { event, data, timestamp } = webhook;

    console.log(`Received webhook: ${event} for payment ${data.id}`);

    // Handle different webhook events
    switch (event) {
      case 'payment.created':
        await handlePaymentCreated(data);
        break;
      
      case 'payment.completed':
        await handlePaymentCompleted(data);
        break;
      
      case 'payment.failed':
        await handlePaymentFailed(data);
        break;
      
      case 'payment.expired':
        await handlePaymentExpired(data);
        break;
      
      case 'refund.completed':
        await handleRefundCompleted(data);
        break;
      
      case 'refund.failed':
        await handleRefundFailed(data);
        break;
      
      default:
        console.warn(`Unknown webhook event: ${event}`);
    }

    // Always respond with 200 to acknowledge receipt
    res.status(200).json({ received: true });

  } catch (error) {
    console.error('Webhook processing error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * Handle payment created event
 */
async function handlePaymentCreated(payment) {
  console.log(`Payment created: ${payment.id}`);
  
  // Update your database
  await updatePaymentStatus(payment.externalReference, 'pending', payment);
  
  // Send confirmation email/SMS to customer
  await sendPaymentConfirmation(payment);
}

/**
 * Handle payment completed event
 */
async function handlePaymentCompleted(payment) {
  console.log(`Payment completed: ${payment.id}`);
  
  // Update your database
  await updatePaymentStatus(payment.externalReference, 'completed', payment);
  
  // Fulfill the order
  await fulfillOrder(payment.externalReference);
  
  // Send success notification
  await sendPaymentSuccess(payment);
  
  // Update inventory if applicable
  await updateInventory(payment.externalReference);
}

/**
 * Handle payment failed event
 */
async function handlePaymentFailed(payment) {
  console.log(`Payment failed: ${payment.id}`);
  
  // Update your database
  await updatePaymentStatus(payment.externalReference, 'failed', payment);
  
  // Send failure notification
  await sendPaymentFailure(payment);
  
  // Release reserved inventory
  await releaseInventory(payment.externalReference);
}

/**
 * Handle payment expired event
 */
async function handlePaymentExpired(payment) {
  console.log(`Payment expired: ${payment.id}`);
  
  // Update your database
  await updatePaymentStatus(payment.externalReference, 'expired', payment);
  
  // Release reserved inventory
  await releaseInventory(payment.externalReference);
}

/**
 * Handle refund completed event
 */
async function handleRefundCompleted(refund) {
  console.log(`Refund completed: ${refund.id}`);
  
  // Update your database
  await updateRefundStatus(refund.paymentId, 'completed', refund);
  
  // Send refund confirmation
  await sendRefundConfirmation(refund);
}

/**
 * Handle refund failed event
 */
async function handleRefundFailed(refund) {
  console.log(`Refund failed: ${refund.id}`);
  
  // Update your database
  await updateRefundStatus(refund.paymentId, 'failed', refund);
  
  // Send refund failure notification
  await sendRefundFailure(refund);
}

/**
 * Database operations (implement based on your database)
 */
async function updatePaymentStatus(externalReference, status, paymentData) {
  // Implement your database update logic
  console.log(`Updating payment ${externalReference} to status: ${status}`);
}

async function updateRefundStatus(paymentId, status, refundData) {
  // Implement your database update logic
  console.log(`Updating refund for payment ${paymentId} to status: ${status}`);
}

/**
 * Business logic operations
 */
async function fulfillOrder(externalReference) {
  // Implement order fulfillment logic
  console.log(`Fulfilling order: ${externalReference}`);
}

async function updateInventory(externalReference) {
  // Implement inventory update logic
  console.log(`Updating inventory for order: ${externalReference}`);
}

async function releaseInventory(externalReference) {
  // Implement inventory release logic
  console.log(`Releasing inventory for order: ${externalReference}`);
}

/**
 * Notification operations
 */
async function sendPaymentConfirmation(payment) {
  // Send email/SMS confirmation
  console.log(`Sending payment confirmation for: ${payment.id}`);
}

async function sendPaymentSuccess(payment) {
  // Send success notification
  console.log(`Sending payment success notification for: ${payment.id}`);
}

async function sendPaymentFailure(payment) {
  // Send failure notification
  console.log(`Sending payment failure notification for: ${payment.id}`);
}

async function sendRefundConfirmation(refund) {
  // Send refund confirmation
  console.log(`Sending refund confirmation for: ${refund.id}`);
}

async function sendRefundFailure(refund) {
  // Send refund failure notification
  console.log(`Sending refund failure notification for: ${refund.id}`);
}

/**
 * Health check endpoint
 */
app.get('/health', (req, res) => {
  res.json({ status: 'healthy', timestamp: new Date().toISOString() });
});

/**
 * Start server
 */
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Webhook server running on port ${PORT}`);
  console.log(`Webhook endpoint: http://localhost:${PORT}/webhooks/tekpay`);
});

module.exports = app;
