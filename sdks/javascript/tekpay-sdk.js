/**
 * TekPay Gateway JavaScript SDK
 * Official SDK for integrating with TekPay Gateway API
 */

class TekPaySDK {
  constructor(apiKey, options = {}) {
    this.apiKey = apiKey;
    this.baseURL = options.baseURL || 'https://api.tekpay.zm';
    this.timeout = options.timeout || 30000;
  }

  /**
   * Make HTTP request to TekPay API
   */
  async request(endpoint, options = {}) {
    const url = `${this.baseURL}${endpoint}`;
    const config = {
      method: options.method || 'GET',
      headers: {
        'Content-Type': 'application/json',
        'X-API-Key': this.apiKey,
        ...options.headers
      },
      ...options
    };

    if (config.body && typeof config.body === 'object') {
      config.body = JSON.stringify(config.body);
    }

    try {
      const response = await fetch(url, config);
      const data = await response.json();

      if (!response.ok) {
        throw new TekPayError(data.message || 'Request failed', response.status, data);
      }

      return data;
    } catch (error) {
      if (error instanceof TekPayError) {
        throw error;
      }
      throw new TekPayError('Network error', 0, { originalError: error.message });
    }
  }

  /**
   * Create a new payment
   */
  async createPayment(paymentData, idempotencyKey = null) {
    const headers = {};
    if (idempotencyKey) {
      headers['Idempotency-Key'] = idempotencyKey;
    }

    return this.request('/api/v1/payments', {
      method: 'POST',
      headers,
      body: paymentData
    });
  }

  /**
   * Get payment details
   */
  async getPayment(paymentId) {
    return this.request(`/api/v1/payments/${paymentId}`);
  }

  /**
   * List payments with optional filters
   */
  async listPayments(filters = {}) {
    const queryParams = new URLSearchParams();
    
    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        queryParams.append(key, value);
      }
    });

    const queryString = queryParams.toString();
    const endpoint = queryString ? `/api/v1/payments?${queryString}` : '/api/v1/payments';
    
    return this.request(endpoint);
  }

  /**
   * Process a refund
   */
  async refundPayment(paymentId, refundData, idempotencyKey = null) {
    const headers = {};
    if (idempotencyKey) {
      headers['Idempotency-Key'] = idempotencyKey;
    }

    return this.request(`/api/v1/payments/${paymentId}/refund`, {
      method: 'POST',
      headers,
      body: refundData
    });
  }

  /**
   * Get usage statistics
   */
  async getUsage(period = null) {
    const endpoint = period ? `/api/v1/usage?period=${period}` : '/api/v1/usage';
    return this.request(endpoint);
  }

  /**
   * Verify webhook signature
   */
  static verifyWebhook(payload, signature, secret) {
    const crypto = require('crypto');
    const expectedSignature = crypto
      .createHmac('sha256', secret)
      .update(payload)
      .digest('hex');
    
    return `sha256=${expectedSignature}` === signature;
  }

  /**
   * Generate UUID for idempotency keys
   */
  static generateUUID() {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
      const r = Math.random() * 16 | 0;
      const v = c == 'x' ? r : (r & 0x3 | 0x8);
      return v.toString(16);
    });
  }

  /**
   * Format phone number for TekPay
   */
  static formatPhoneNumber(phoneNumber) {
    // Remove all non-digits
    const digits = phoneNumber.replace(/\D/g, '');
    
    // Add country code if missing
    if (digits.length === 9 && (digits.startsWith('97') || digits.startsWith('96') || digits.startsWith('95'))) {
      return `260${digits}`;
    }
    
    // Return as-is if already formatted
    if (digits.length === 12 && digits.startsWith('260')) {
      return digits;
    }
    
    throw new Error('Invalid phone number format');
  }

  /**
   * Validate MNO for phone number
   */
  static detectMNO(phoneNumber) {
    const formatted = this.formatPhoneNumber(phoneNumber);
    const prefix = formatted.substring(3, 5);
    
    if (['97', '96', '95'].includes(prefix)) {
      return prefix === '97' ? 'MTN' : 'AIRTEL';
    }
    
    throw new Error('Unable to detect MNO from phone number');
  }
}

/**
 * Custom error class for TekPay API errors
 */
class TekPayError extends Error {
  constructor(message, statusCode, details = {}) {
    super(message);
    this.name = 'TekPayError';
    this.statusCode = statusCode;
    this.details = details;
  }
}

/**
 * Payment status constants
 */
const PaymentStatus = {
  PENDING: 'PENDING',
  COMPLETED: 'COMPLETED',
  FAILED: 'FAILED',
  EXPIRED: 'EXPIRED',
  CANCELLED: 'CANCELLED'
};

/**
 * MNO constants
 */
const MNO = {
  MTN: 'MTN',
  AIRTEL: 'AIRTEL'
};

/**
 * Currency constants
 */
const Currency = {
  ZMW: 'ZMW'
};

// Export for Node.js
if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    TekPaySDK,
    TekPayError,
    PaymentStatus,
    MNO,
    Currency
  };
}

// Export for browsers
if (typeof window !== 'undefined') {
  window.TekPaySDK = TekPaySDK;
  window.TekPayError = TekPayError;
  window.PaymentStatus = PaymentStatus;
  window.MNO = MNO;
  window.Currency = Currency;
}

/**
 * Usage Examples:
 * 
 * // Initialize SDK
 * const tekpay = new TekPaySDK('your_api_key_here');
 * 
 * // Create payment
 * const payment = await tekpay.createPayment({
 *   amount: 100.00,
 *   currency: 'ZMW',
 *   phoneNumber: '260971234567',
 *   mno: 'MTN',
 *   description: 'Test payment',
 *   externalReference: 'order_123'
 * }, TekPaySDK.generateUUID());
 * 
 * // Check payment status
 * const status = await tekpay.getPayment(payment.id);
 * 
 * // List payments
 * const payments = await tekpay.listPayments({
 *   status: 'COMPLETED',
 *   limit: 10
 * });
 * 
 * // Process refund
 * const refund = await tekpay.refundPayment(payment.id, {
 *   amount: 50.00,
 *   reason: 'Customer request'
 * }, TekPaySDK.generateUUID());
 * 
 * // Verify webhook
 * const isValid = TekPaySDK.verifyWebhook(
 *   JSON.stringify(webhookPayload),
 *   req.headers['x-tekpay-signature'],
 *   'your_webhook_secret'
 * );
 */
