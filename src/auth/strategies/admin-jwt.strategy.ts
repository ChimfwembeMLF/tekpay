import { ExtractJwt, Strategy } from 'passport-jwt';
import { PassportStrategy } from '@nestjs/passport';
import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AdminUser } from '../entities/admin-user.entity';

@Injectable()
export class AdminJwtStrategy extends PassportStrategy(Strategy, 'admin-jwt') {
  constructor(
    private readonly configService: ConfigService,
    @InjectRepository(AdminUser)
    private readonly adminUserRepository: Repository<AdminUser>,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: configService.get<string>('JWT_SECRET'),
    });
  }

  async validate(payload: any): Promise<AdminUser> {
    // Ensure this is an admin token
    if (payload.type !== 'admin') {
      throw new UnauthorizedException('Invalid token type');
    }

    const adminUser = await this.adminUserRepository.findOne({
      where: { id: payload.sub },
    });

    if (!adminUser) {
      throw new UnauthorizedException('Admin user not found');
    }

    if (!adminUser.isActive) {
      throw new UnauthorizedException('Admin account is inactive');
    }

    // Update last login
    adminUser.lastLoginAt = new Date();
    await this.adminUserRepository.save(adminUser);

    return adminUser;
  }
}
