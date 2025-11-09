import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiSecurity,
  ApiQuery,
} from '@nestjs/swagger';
import { BillingService } from './billing.service';
import { ApiKeyGuard } from '@/common/guards/api-key.guard';
import { ApiConsumer } from '@/auth/entities/api-consumer.entity';
import { ApiKey } from '@/common/decorators/api-key.decorator';

@ApiTags('Billing')
@Controller('v1/usage')
@UseGuards(ApiKeyGuard)
@ApiSecurity('api-key')
export class BillingController {
  constructor(private readonly billingService: BillingService) {}

  @Get()
  @ApiOperation({ summary: 'Get usage and billing information' })
  @ApiQuery({ name: 'period', required: false, description: 'Billing period (YYYY-MM)' })
  @ApiResponse({ status: 200, description: 'Usage information retrieved' })
  async getUsage(
    @ApiKey() consumer: ApiConsumer,
    @Query('period') period?: string,
  ) {
    const usage = await this.billingService.getUsage(consumer.id, period);
    const charges = await this.billingService.calculateCharges(consumer, usage);

    return {
      billingPeriod: usage.billingPeriod,
      apiCalls: usage.apiCalls,
      totalVolume: usage.totalVolume,
      charges,
      plan: consumer.pricingPlan,
      monthlyQuota: consumer.monthlyQuota,
      quotaUsagePercentage: Math.round((usage.apiCalls / consumer.monthlyQuota) * 100),
      lastUpdated: usage.lastUpdated,
    };
  }
}