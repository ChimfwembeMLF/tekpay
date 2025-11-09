import { IsString, IsEmail, IsEnum, IsOptional, IsNumber } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { PricingPlan } from '@/common/enums/payment.enum';

export class CreateConsumerDto {
  @ApiProperty({ example: 'Acme Corporation' })
  @IsString()
  name: string;

  @ApiProperty({ example: 'contact@acme.com' })
  @IsEmail()
  email: string;

  @ApiProperty({ enum: PricingPlan, default: PricingPlan.STANDARD })
  @IsEnum(PricingPlan)
  @IsOptional()
  pricingPlan?: PricingPlan;

  @ApiProperty({ example: 10000, default: 10000 })
  @IsNumber()
  @IsOptional()
  monthlyQuota?: number;
}