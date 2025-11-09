import { Strategy } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';
import { Repository } from 'typeorm';
import { AdminUser } from '../entities/admin-user.entity';
declare const AdminJwtStrategy_base: new (...args: [opt: import("passport-jwt").StrategyOptions] | [opt: import("passport-jwt").StrategyOptions]) => Strategy & {
    validate(...args: any[]): unknown;
};
export declare class AdminJwtStrategy extends AdminJwtStrategy_base {
    private readonly configService;
    private readonly adminUserRepository;
    constructor(configService: ConfigService, adminUserRepository: Repository<AdminUser>);
    validate(payload: any): Promise<AdminUser>;
}
export {};
