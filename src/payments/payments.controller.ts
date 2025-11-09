import {
  Controller,
  Post,
  Get,
  Body,
  Param,
  Query,
  UseGuards,
  Headers,
  ParseUUIDPipe,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiSecurity,
  ApiQuery,
} from '@nestjs/swagger';
import { PaymentsService } from './payments.service';
import { CreatePaymentDto } from './dto/create-payment.dto';
import { RefundPaymentDto } from './dto/refund-payment.dto';
import { ApiKeyGuard } from '@/common/guards/api-key.guard';
import { ApiConsumer } from '@/auth/entities/api-consumer.entity';
import { ApiKey } from '@/common/decorators/api-key.decorator';
import { PaymentStatus } from '@/common/enums/payment.enum';

@ApiTags('Payments')
@Controller('v1/payments')
@UseGuards(ApiKeyGuard)
@ApiSecurity('api-key')
export class PaymentsController {
  constructor(private readonly paymentsService: PaymentsService) {}

  @Post()
  @ApiOperation({ summary: 'Create a new payment' })
  @ApiResponse({ status: 201, description: 'Payment created successfully' })
  @ApiResponse({ status: 400, description: 'Bad request' })
  async createPayment(
    @Body() createPaymentDto: CreatePaymentDto,
    @ApiKey() consumer: ApiConsumer,
    @Headers('idempotency-key') idempotencyKey?: string,
  ) {
    const payment = await this.paymentsService.createPayment(
      createPaymentDto,
      consumer,
      idempotencyKey,
    );

    return {
      id: payment.id,
      amount: payment.amount,
      currency: payment.currency,
      mno: payment.mno,
      phoneNumber: payment.phoneNumber,
      status: payment.status,
      externalReference: payment.externalReference,
      expiresAt: payment.expiresAt,
      createdAt: payment.createdAt,
    };
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get payment details' })
  @ApiResponse({ status: 200, description: 'Payment details retrieved' })
  @ApiResponse({ status: 404, description: 'Payment not found' })
  async getPayment(
    @Param('id', ParseUUIDPipe) id: string,
    @ApiKey() consumer: ApiConsumer,
  ) {
    return await this.paymentsService.getPayment(id, consumer.id);
  }

  @Get()
  @ApiOperation({ summary: 'List payments' })
  @ApiQuery({ name: 'status', enum: PaymentStatus, required: false })
  @ApiQuery({ name: 'dateFrom', type: 'string', required: false })
  @ApiQuery({ name: 'dateTo', type: 'string', required: false })
  @ApiQuery({ name: 'limit', type: 'number', required: false })
  @ApiQuery({ name: 'offset', type: 'number', required: false })
  @ApiResponse({ status: 200, description: 'Payments retrieved successfully' })
  async listPayments(
    @ApiKey() consumer: ApiConsumer,
    @Query('status') status?: PaymentStatus,
    @Query('dateFrom') dateFrom?: string,
    @Query('dateTo') dateTo?: string,
    @Query('limit') limit?: number,
    @Query('offset') offset?: number,
  ) {
    const filters: any = {};
    
    if (status) filters.status = status;
    if (dateFrom) filters.dateFrom = new Date(dateFrom);
    if (dateTo) filters.dateTo = new Date(dateTo);
    if (limit) filters.limit = Number(limit);
    if (offset) filters.offset = Number(offset);

    return await this.paymentsService.listPayments(consumer.id, filters);
  }

  @Post(':id/refund')
  @ApiOperation({ summary: 'Refund a payment' })
  @ApiResponse({ status: 201, description: 'Refund initiated successfully' })
  @ApiResponse({ status: 400, description: 'Payment cannot be refunded' })
  @ApiResponse({ status: 404, description: 'Payment not found' })
  async refundPayment(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() refundDto: RefundPaymentDto,
    @ApiKey() consumer: ApiConsumer,
    @Headers('idempotency-key') idempotencyKey?: string,
  ) {
    return await this.paymentsService.refundPayment(
      id,
      refundDto,
      consumer.id,
      idempotencyKey,
    );
  }
}