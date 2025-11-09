import { Injectable, UnauthorizedException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { JwtService } from '@nestjs/jwt';
import { v4 as uuidv4 } from 'uuid';
import { ApiConsumer } from './entities/api-consumer.entity';
import { CreateConsumerDto } from './dto/create-consumer.dto';
import { LoginDto } from './dto/login.dto';

@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(ApiConsumer)
    private readonly apiConsumerRepository: Repository<ApiConsumer>,
    private readonly jwtService: JwtService,
  ) {}

  async createConsumer(createConsumerDto: CreateConsumerDto): Promise<ApiConsumer> {
    const apiKey = `tek_${uuidv4().replace(/-/g, '')}`;
    
    const consumer = this.apiConsumerRepository.create({
      ...createConsumerDto,
      apiKey,
    });

    return await this.apiConsumerRepository.save(consumer);
  }

  async login(loginDto: LoginDto): Promise<{ access_token: string; consumer: ApiConsumer }> {
    const { email, apiKey } = loginDto;
    
    const consumer = await this.apiConsumerRepository.findOne({
      where: { email, apiKey, isActive: true },
    });

    if (!consumer) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const payload = { sub: consumer.id, email: consumer.email };
    const access_token = this.jwtService.sign(payload);

    return {
      access_token,
      consumer,
    };
  }

  async findById(id: string): Promise<ApiConsumer> {
    return await this.apiConsumerRepository.findOne({
      where: { id, isActive: true },
    });
  }

  async findByApiKey(apiKey: string): Promise<ApiConsumer> {
    return await this.apiConsumerRepository.findOne({
      where: { apiKey, isActive: true },
    });
  }
}