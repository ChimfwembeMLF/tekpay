import { Repository } from 'typeorm';
import { JwtService } from '@nestjs/jwt';
import { ApiConsumer } from './entities/api-consumer.entity';
import { CreateConsumerDto } from './dto/create-consumer.dto';
import { LoginDto } from './dto/login.dto';
export declare class AuthService {
    private readonly apiConsumerRepository;
    private readonly jwtService;
    constructor(apiConsumerRepository: Repository<ApiConsumer>, jwtService: JwtService);
    createConsumer(createConsumerDto: CreateConsumerDto): Promise<ApiConsumer>;
    login(loginDto: LoginDto): Promise<{
        access_token: string;
        consumer: ApiConsumer;
    }>;
    findById(id: string): Promise<ApiConsumer>;
    findByApiKey(apiKey: string): Promise<ApiConsumer>;
}
