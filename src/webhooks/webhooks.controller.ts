import {
  Controller,
  Post,
  Body,
  Headers,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { WebhooksService } from './webhooks.service';

@ApiTags('Webhooks')
@Controller('webhooks')
export class WebhooksController {
  constructor(private readonly webhooksService: WebhooksService) {}

  @Post('mtn')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Handle MTN webhook' })
  @ApiResponse({ status: 200, description: 'Webhook processed successfully' })
  @ApiResponse({ status: 400, description: 'Invalid webhook data' })
  async handleMtnWebhook(
    @Body() payload: any,
    @Headers('x-signature') signature?: string,
  ): Promise<{ success: boolean }> {
    await this.webhooksService.handleMtnWebhook(payload, signature);
    return { success: true };
  }

  @Post('airtel')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Handle Airtel webhook' })
  @ApiResponse({ status: 200, description: 'Webhook processed successfully' })
  @ApiResponse({ status: 400, description: 'Invalid webhook data' })
  async handleAirtelWebhook(
    @Body() payload: any,
    @Headers('x-signature') signature?: string,
  ): Promise<{ success: boolean }> {
    await this.webhooksService.handleAirtelWebhook(payload, signature);
    return { success: true };
  }
}