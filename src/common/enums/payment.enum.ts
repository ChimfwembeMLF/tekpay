export enum PaymentStatus {
  CREATED = 'created',
  INITIATED = 'initiated',
  PENDING = 'pending',
  COMPLETED = 'completed',
  SETTLED = 'settled',
  FAILED = 'failed',
  REFUNDED = 'refunded',
  EXPIRED = 'expired',
}

export enum TransactionType {
  PAYMENT = 'payment',
  REFUND = 'refund',
  FEE = 'fee',
  SETTLEMENT = 'settlement',
}

export enum MNOProvider {
  MTN = 'MTN',
  AIRTEL = 'AIRTEL',
}

export enum Currency {
  ZMW = 'ZMW',
}

export enum PricingPlan {
  BASIC = 'basic',
  STANDARD = 'standard',
  PREMIUM = 'premium',
  ENTERPRISE = 'enterprise',
}