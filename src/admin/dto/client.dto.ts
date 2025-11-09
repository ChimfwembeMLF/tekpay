import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsString,
  IsEmail,
  IsOptional,
  IsBoolean,
  IsEnum,
  IsUrl,
  MinLength,
  MaxLength,
  IsNotEmpty,
} from 'class-validator';
import { PricingPlan } from '@/common/enums/payment.enum';

export class CreateClientDto {
  @ApiProperty({
    description: 'Client/Company name',
    example: 'Acme E-commerce Ltd',
  })
  @IsString()
  @IsNotEmpty()
  @MinLength(2)
  @MaxLength(100)
  name: string;

  @ApiProperty({
    description: 'Client email address',
    example: 'admin@acme-ecommerce.com',
  })
  @IsEmail()
  @IsNotEmpty()
  email: string;

  @ApiProperty({
    description: 'Client description/business details',
    example: 'E-commerce platform specializing in electronics and gadgets',
  })
  @IsString()
  @IsNotEmpty()
  @MinLength(10)
  @MaxLength(500)
  description: string;

  @ApiProperty({
    description: 'Webhook URL for payment notifications',
    example: 'https://api.acme-ecommerce.com/webhooks/tekpay',
  })
  @IsUrl()
  @IsNotEmpty()
  webhookUrl: string;

  @ApiPropertyOptional({
    description: 'Pricing plan for the client',
    enum: PricingPlan,
    default: PricingPlan.STANDARD,
  })
  @IsEnum(PricingPlan)
  @IsOptional()
  pricingPlan?: PricingPlan = PricingPlan.STANDARD;

  @ApiPropertyOptional({
    description: 'Whether the client is active',
    default: true,
  })
  @IsBoolean()
  @IsOptional()
  isActive?: boolean = true;

  @ApiPropertyOptional({
    description: 'Additional contact information',
    example: '+260971234567',
  })
  @IsString()
  @IsOptional()
  @MaxLength(50)
  contactInfo?: string;

  @ApiPropertyOptional({
    description: 'Client business address',
    example: 'Plot 123, Independence Avenue, Lusaka, Zambia',
  })
  @IsString()
  @IsOptional()
  @MaxLength(200)
  address?: string;
}

export class UpdateClientDto {
  @ApiPropertyOptional({
    description: 'Client/Company name',
    example: 'Acme E-commerce Ltd',
  })
  @IsString()
  @IsOptional()
  @MinLength(2)
  @MaxLength(100)
  name?: string;

  @ApiPropertyOptional({
    description: 'Client email address',
    example: 'admin@acme-ecommerce.com',
  })
  @IsEmail()
  @IsOptional()
  email?: string;

  @ApiPropertyOptional({
    description: 'Client description/business details',
    example: 'E-commerce platform specializing in electronics and gadgets',
  })
  @IsString()
  @IsOptional()
  @MinLength(10)
  @MaxLength(500)
  description?: string;

  @ApiPropertyOptional({
    description: 'Webhook URL for payment notifications',
    example: 'https://api.acme-ecommerce.com/webhooks/tekpay',
  })
  @IsUrl()
  @IsOptional()
  webhookUrl?: string;

  @ApiPropertyOptional({
    description: 'Pricing plan for the client',
    enum: PricingPlan,
  })
  @IsEnum(PricingPlan)
  @IsOptional()
  pricingPlan?: PricingPlan;

  @ApiPropertyOptional({
    description: 'Additional contact information',
    example: '+260971234567',
  })
  @IsString()
  @IsOptional()
  @MaxLength(50)
  contactInfo?: string;

  @ApiPropertyOptional({
    description: 'Client business address',
    example: 'Plot 123, Independence Avenue, Lusaka, Zambia',
  })
  @IsString()
  @IsOptional()
  @MaxLength(200)
  address?: string;
}

export class ClientStatusDto {
  @ApiProperty({
    description: 'Whether the client should be active or inactive',
    example: true,
  })
  @IsBoolean()
  @IsNotEmpty()
  isActive: boolean;
}

export class ClientResponseDto {
  @ApiProperty({ description: 'Client unique identifier' })
  id: string;

  @ApiProperty({ description: 'Client name' })
  name: string;

  @ApiProperty({ description: 'Client email' })
  email: string;

  @ApiProperty({ description: 'Client description' })
  description: string;

  @ApiProperty({ description: 'Webhook URL' })
  webhookUrl: string;

  @ApiProperty({ description: 'API key (masked)' })
  apiKey: string;

  @ApiProperty({ description: 'Pricing plan', enum: PricingPlan })
  pricingPlan: PricingPlan;

  @ApiProperty({ description: 'Whether client is active' })
  isActive: boolean;

  @ApiPropertyOptional({ description: 'Contact information' })
  contactInfo?: string;

  @ApiPropertyOptional({ description: 'Business address' })
  address?: string;

  @ApiProperty({ description: 'Creation date' })
  createdAt: Date;

  @ApiProperty({ description: 'Last update date' })
  updatedAt: Date;

  @ApiPropertyOptional({ description: 'Last activity date' })
  lastActivityAt?: Date;

  @ApiProperty({ description: 'Total payments count' })
  totalPayments: number;

  @ApiProperty({ description: 'Total volume processed' })
  totalVolume: number;

  @ApiProperty({ description: 'Success rate percentage' })
  successRate: number;
}

export class ClientAnalyticsDto {
  @ApiProperty({ description: 'Client information' })
  client: ClientResponseDto;

  @ApiProperty({ description: 'Payment statistics' })
  paymentStats: {
    total: number;
    completed: number;
    failed: number;
    pending: number;
    successRate: number;
  };

  @ApiProperty({ description: 'Volume statistics' })
  volumeStats: {
    total: number;
    currency: string;
    averageTransaction: number;
  };

  @ApiProperty({ description: 'MNO distribution' })
  mnoDistribution: {
    mtn: number;
    airtel: number;
  };

  @ApiProperty({ description: 'Daily trends' })
  dailyTrends: Array<{
    date: string;
    count: number;
    volume: number;
    successRate: number;
  }>;

  @ApiProperty({ description: 'Usage billing information' })
  billing: {
    currentMonth: number;
    previousMonth: number;
    totalCost: number;
  };
}
