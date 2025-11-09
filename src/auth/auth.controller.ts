import { Controller, Post, Body } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { AuthService } from './auth.service';
import { CreateConsumerDto } from './dto/create-consumer.dto';
import { LoginDto } from './dto/login.dto';

@ApiTags('Authentication')
@Controller('v1/auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('register')
  @ApiOperation({ summary: 'Register a new API consumer' })
  @ApiResponse({ status: 201, description: 'Consumer successfully registered' })
  async register(@Body() createConsumerDto: CreateConsumerDto) {
    const consumer = await this.authService.createConsumer(createConsumerDto);
    
    return {
      id: consumer.id,
      name: consumer.name,
      email: consumer.email,
      apiKey: consumer.apiKey,
      pricingPlan: consumer.pricingPlan,
      monthlyQuota: consumer.monthlyQuota,
      createdAt: consumer.createdAt,
    };
  }

  @Post('login')
  @ApiOperation({ summary: 'Login with email and API key' })
  @ApiResponse({ status: 200, description: 'Successfully authenticated' })
  async login(@Body() loginDto: LoginDto) {
    return await this.authService.login(loginDto);
  }
}