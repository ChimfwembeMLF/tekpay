import { CanActivate, ExecutionContext } from '@nestjs/common';
import { Repository } from 'typeorm';
import { ApiConsumer } from '@/auth/entities/api-consumer.entity';
export declare class ApiKeyGuard implements CanActivate {
    private readonly apiConsumerRepository;
    constructor(apiConsumerRepository: Repository<ApiConsumer>);
    canActivate(context: ExecutionContext): Promise<boolean>;
}
