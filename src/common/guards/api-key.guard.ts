import {
  Injectable,
  CanActivate,
  ExecutionContext,
  UnauthorizedException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ApiConsumer } from '@/auth/entities/api-consumer.entity';

@Injectable()
export class ApiKeyGuard implements CanActivate {
  constructor(
    @InjectRepository(ApiConsumer)
    private readonly apiConsumerRepository: Repository<ApiConsumer>,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const apiKey = request.headers['x-api-key'];

    if (!apiKey) {
      throw new UnauthorizedException('API key is required');
    }

    const consumer = await this.apiConsumerRepository.findOne({
      where: { apiKey, isActive: true },
    });

    if (!consumer) {
      throw new UnauthorizedException('Invalid API key');
    }

    request.apiConsumer = consumer;
    return true;
  }
}