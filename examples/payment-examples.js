/**
 * TekPay SDK - Payment Examples
 * 
 * This file contains practical examples of how to use the TekPay SDK
 * for various payment scenarios and use cases.
 */

const { TekPaySDK, PaymentStatus, MNO, Currency } = require('../sdks/javascript/tekpay-sdk.js');

// Initialize SDK
const tekpay = new TekPaySDK(process.env.TEKPAY_API_KEY, {
  baseURL: process.env.TEKPAY_BASE_URL || 'https://api.tekpay.zm'
});

/**
 * Example 1: Basic Payment Creation
 */
async function createBasicPayment() {
  try {
    const payment = await tekpay.createPayment({
      amount: 100.00,
      currency: 'ZMW',
      phoneNumber: '260971234567',
      mno: 'MTN',
      description: 'Test payment',
      externalReference: 'order_123'
    }, TekPaySDK.generateUUID());

    console.log('Payment created:', payment);
    return payment;
  } catch (error) {
    console.error('Payment creation failed:', error);
    throw error;
  }
}

/**
 * Example 2: E-commerce Order Payment
 */
async function createEcommercePayment(orderData) {
  const paymentData = {
    amount: orderData.total,
    currency: Currency.ZMW,
    phoneNumber: TekPaySDK.formatPhoneNumber(orderData.customerPhone),
    mno: TekPaySDK.detectMNO(orderData.customerPhone),
    description: `Payment for Order #${orderData.orderNumber}`,
    externalReference: `order_${orderData.orderNumber}`,
    metadata: {
      orderId: orderData.orderNumber,
      customerId: orderData.customerId,
      items: orderData.items,
      shippingAddress: orderData.shippingAddress
    }
  };

  try {
    const payment = await tekpay.createPayment(
      paymentData, 
      `order_${orderData.orderNumber}_${Date.now()}`
    );

    console.log('E-commerce payment created:', payment);
    return payment;
  } catch (error) {
    console.error('E-commerce payment failed:', error);
    throw error;
  }
}

/**
 * Example 3: Subscription Payment
 */
async function createSubscriptionPayment(subscriptionData) {
  const paymentData = {
    amount: subscriptionData.monthlyAmount,
    currency: Currency.ZMW,
    phoneNumber: subscriptionData.customerPhone,
    mno: subscriptionData.preferredMno,
    description: `${subscriptionData.planName} - Monthly Subscription`,
    externalReference: `sub_${subscriptionData.subscriptionId}_${subscriptionData.billingPeriod}`,
    metadata: {
      subscriptionId: subscriptionData.subscriptionId,
      planName: subscriptionData.planName,
      billingPeriod: subscriptionData.billingPeriod,
      customerId: subscriptionData.customerId,
      isRecurring: true
    }
  };

  try {
    const payment = await tekpay.createPayment(
      paymentData,
      `sub_${subscriptionData.subscriptionId}_${subscriptionData.billingPeriod}`
    );

    console.log('Subscription payment created:', payment);
    return payment;
  } catch (error) {
    console.error('Subscription payment failed:', error);
    throw error;
  }
}

/**
 * Example 4: Utility Bill Payment
 */
async function createUtilityPayment(billData) {
  const paymentData = {
    amount: billData.amount,
    currency: Currency.ZMW,
    phoneNumber: billData.customerPhone,
    mno: billData.mno,
    description: `${billData.utilityType} Bill Payment - ${billData.accountNumber}`,
    externalReference: `bill_${billData.billId}`,
    metadata: {
      utilityType: billData.utilityType, // 'electricity', 'water', 'internet'
      accountNumber: billData.accountNumber,
      billPeriod: billData.billPeriod,
      dueDate: billData.dueDate,
      customerId: billData.customerId
    }
  };

  try {
    const payment = await tekpay.createPayment(
      paymentData,
      `bill_${billData.billId}`
    );

    console.log('Utility payment created:', payment);
    return payment;
  } catch (error) {
    console.error('Utility payment failed:', error);
    throw error;
  }
}

/**
 * Example 5: Payment Status Monitoring
 */
async function monitorPaymentStatus(paymentId, maxAttempts = 30) {
  let attempts = 0;
  
  while (attempts < maxAttempts) {
    try {
      const payment = await tekpay.getPayment(paymentId);
      
      console.log(`Payment ${paymentId} status: ${payment.status}`);
      
      if (payment.status === PaymentStatus.COMPLETED) {
        console.log('Payment completed successfully!');
        return payment;
      }
      
      if (payment.status === PaymentStatus.FAILED || payment.status === PaymentStatus.EXPIRED) {
        console.log('Payment failed or expired');
        return payment;
      }
      
      // Wait 10 seconds before checking again
      await new Promise(resolve => setTimeout(resolve, 10000));
      attempts++;
      
    } catch (error) {
      console.error('Error checking payment status:', error);
      attempts++;
      await new Promise(resolve => setTimeout(resolve, 5000));
    }
  }
  
  throw new Error('Payment status monitoring timeout');
}

/**
 * Example 6: Bulk Payment Processing
 */
async function processBulkPayments(paymentsList) {
  const results = [];
  
  for (const paymentData of paymentsList) {
    try {
      const payment = await tekpay.createPayment(
        paymentData,
        TekPaySDK.generateUUID()
      );
      
      results.push({
        success: true,
        payment: payment,
        originalData: paymentData
      });
      
      // Add delay to avoid rate limiting
      await new Promise(resolve => setTimeout(resolve, 1000));
      
    } catch (error) {
      results.push({
        success: false,
        error: error.message,
        originalData: paymentData
      });
    }
  }
  
  return results;
}

/**
 * Example 7: Payment with Retry Logic
 */
async function createPaymentWithRetry(paymentData, maxRetries = 3) {
  let lastError;
  
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      const payment = await tekpay.createPayment(
        paymentData,
        TekPaySDK.generateUUID()
      );
      
      console.log(`Payment created on attempt ${attempt}`);
      return payment;
      
    } catch (error) {
      lastError = error;
      console.log(`Payment attempt ${attempt} failed:`, error.message);
      
      if (attempt < maxRetries) {
        // Exponential backoff
        const delay = Math.pow(2, attempt) * 1000;
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
  }
  
  throw lastError;
}

/**
 * Example 8: Refund Processing
 */
async function processRefund(paymentId, refundAmount, reason) {
  try {
    const refund = await tekpay.refundPayment(
      paymentId,
      {
        amount: refundAmount,
        reason: reason
      },
      TekPaySDK.generateUUID()
    );
    
    console.log('Refund processed:', refund);
    return refund;
    
  } catch (error) {
    console.error('Refund processing failed:', error);
    throw error;
  }
}

/**
 * Example Usage
 */
async function runExamples() {
  try {
    // Example 1: Basic payment
    console.log('=== Basic Payment Example ===');
    const basicPayment = await createBasicPayment();
    
    // Example 2: Monitor payment status
    console.log('=== Monitoring Payment Status ===');
    await monitorPaymentStatus(basicPayment.id);
    
    // Example 3: E-commerce payment
    console.log('=== E-commerce Payment Example ===');
    const orderData = {
      orderNumber: 'ORD-001',
      customerId: 'CUST-123',
      customerPhone: '260971234567',
      total: 250.00,
      items: [
        { name: 'Product A', price: 150.00, quantity: 1 },
        { name: 'Product B', price: 100.00, quantity: 1 }
      ],
      shippingAddress: 'Lusaka, Zambia'
    };
    
    await createEcommercePayment(orderData);
    
    console.log('All examples completed successfully!');
    
  } catch (error) {
    console.error('Example execution failed:', error);
  }
}

// Export functions for use in other modules
module.exports = {
  createBasicPayment,
  createEcommercePayment,
  createSubscriptionPayment,
  createUtilityPayment,
  monitorPaymentStatus,
  processBulkPayments,
  createPaymentWithRetry,
  processRefund,
  runExamples
};

// Run examples if this file is executed directly
if (require.main === module) {
  runExamples();
}
