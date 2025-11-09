import { IsString, IsNumber, IsEnum, IsOptional, IsUrl, Min } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { MNOProvider } from '@/common/enums/payment.enum';

export class CreatePaymentDto {
  @ApiProperty({ example: 1000.00, description: 'Payment amount in ZMW' })
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(1)
  amount: number;

  @ApiProperty({ enum: MNOProvider, example: MNOProvider.MTN })
  @IsEnum(MNOProvider)
  mno: MNOProvider;

  @ApiProperty({ example: '260976123456', description: 'Customer phone number' })
  @IsString()
  phoneNumber: string;

  @ApiProperty({ example: 'ORDER-123', required: false })
  @IsString()
  @IsOptional()
  externalReference?: string;

  @ApiProperty({ example: 'https://merchant.com/callback', required: false })
  @IsUrl()
  @IsOptional()
  callbackUrl?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  metadata?: any;
}