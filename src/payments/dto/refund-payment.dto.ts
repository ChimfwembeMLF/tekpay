import { IsString, IsNumber, IsOptional, Min } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class RefundPaymentDto {
  @ApiProperty({ example: 100.00, description: 'Refund amount (optional, defaults to full amount)' })
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0.01)
  @IsOptional()
  amount?: number;

  @ApiProperty({ example: 'Customer requested refund', required: false })
  @IsString()
  @IsOptional()
  reason?: string;
}