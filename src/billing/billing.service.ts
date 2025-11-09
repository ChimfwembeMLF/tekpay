import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { UsageBilling } from './entities/usage-billing.entity';
import { ApiConsumer } from '@/auth/entities/api-consumer.entity';
import { PricingPlan } from '@/common/enums/payment.enum';

@Injectable()
export class BillingService {
  constructor(
    @InjectRepository(UsageBilling)
    private readonly usageBillingRepository: Repository<UsageBilling>,
  ) {}

  async logApiUsage(consumerId: string, calls: number, volume: number): Promise<void> {
    const billingPeriod = this.getCurrentBillingPeriod();
    
    let usage = await this.usageBillingRepository.findOne({
      where: { consumerId, billingPeriod },
    });

    if (!usage) {
      usage = this.usageBillingRepository.create({
        consumerId,
        billingPeriod,
        apiCalls: 0,
        totalVolume: 0,
        charges: 0,
      });
    }

    usage.apiCalls += calls;
    usage.totalVolume = Number(usage.totalVolume) + volume;
    usage.lastUpdated = new Date();

    await this.usageBillingRepository.save(usage);
  }

  async getUsage(consumerId: string, period?: string): Promise<UsageBilling> {
    const billingPeriod = period || this.getCurrentBillingPeriod();
    
    let usage = await this.usageBillingRepository.findOne({
      where: { consumerId, billingPeriod },
    });

    if (!usage) {
      usage = this.usageBillingRepository.create({
        consumerId,
        billingPeriod,
        apiCalls: 0,
        totalVolume: 0,
        charges: 0,
      });
    }

    return usage;
  }

  async calculateCharges(consumer: ApiConsumer, usage: UsageBilling): Promise<number> {
    const rates = this.getPricingRates(consumer.pricingPlan);
    
    let charges = 0;
    
    // Base charges for API calls
    charges += usage.apiCalls * rates.perCall;
    
    // Volume-based charges (percentage of total volume)
    charges += Number(usage.totalVolume) * rates.volumePercentage;
    
    // Quota overage charges
    if (usage.apiCalls > consumer.monthlyQuota) {
      const overage = usage.apiCalls - consumer.monthlyQuota;
      charges += overage * rates.overageRate;
    }

    return Math.round(charges * 100) / 100; // Round to 2 decimal places
  }

  async updateCharges(consumerId: string, period?: string): Promise<void> {
    const billingPeriod = period || this.getCurrentBillingPeriod();
    
    const usage = await this.usageBillingRepository.findOne({
      where: { consumerId, billingPeriod },
      relations: ['consumer'],
    });

    if (usage && usage.consumer) {
      const charges = await this.calculateCharges(usage.consumer, usage);
      usage.charges = charges;
      await this.usageBillingRepository.save(usage);
    }
  }

  private getCurrentBillingPeriod(): string {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  }

  private getPricingRates(plan: PricingPlan) {
    const rates = {
      [PricingPlan.BASIC]: {
        perCall: 0.01, // ZMW 0.01 per call
        volumePercentage: 0.001, // 0.1% of volume
        overageRate: 0.02, // ZMW 0.02 per overage call
      },
      [PricingPlan.STANDARD]: {
        perCall: 0.008,
        volumePercentage: 0.0008,
        overageRate: 0.015,
      },
      [PricingPlan.PREMIUM]: {
        perCall: 0.006,
        volumePercentage: 0.0006,
        overageRate: 0.01,
      },
      [PricingPlan.ENTERPRISE]: {
        perCall: 0.004,
        volumePercentage: 0.0004,
        overageRate: 0.008,
      },
    };

    return rates[plan] || rates[PricingPlan.STANDARD];
  }
}