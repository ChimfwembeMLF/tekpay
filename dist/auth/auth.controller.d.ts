import { AuthService } from './auth.service';
import { CreateConsumerDto } from './dto/create-consumer.dto';
import { LoginDto } from './dto/login.dto';
export declare class AuthController {
    private readonly authService;
    constructor(authService: AuthService);
    register(createConsumerDto: CreateConsumerDto): Promise<{
        id: string;
        name: string;
        email: string;
        apiKey: string;
        pricingPlan: import("../common/enums/payment.enum").PricingPlan;
        monthlyQuota: number;
        createdAt: Date;
    }>;
    login(loginDto: LoginDto): Promise<{
        access_token: string;
        consumer: import("./entities/api-consumer.entity").ApiConsumer;
    }>;
}
