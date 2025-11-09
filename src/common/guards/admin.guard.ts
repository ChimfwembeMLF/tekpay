import { Injectable, CanActivate, ExecutionContext, ForbiddenException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { AdminUser, AdminRole } from '@/auth/entities/admin-user.entity';

@Injectable()
export class AdminGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const requiredRole = this.reflector.getAllAndOverride<AdminRole>('adminRole', [
      context.getHandler(),
      context.getClass(),
    ]);

    const request = context.switchToHttp().getRequest();
    const user: AdminUser = request.user;

    if (!user) {
      throw new ForbiddenException('User not authenticated');
    }

    if (!user.isActive) {
      throw new ForbiddenException('User account is inactive');
    }

    // If no specific role required, just check if user is authenticated
    if (!requiredRole) {
      return true;
    }

    // Check role hierarchy
    switch (requiredRole) {
      case AdminRole.ADMIN:
        return user.isAdmin;
      case AdminRole.MANAGER:
        return user.isManager;
      case AdminRole.VIEWER:
        return user.isViewer;
      default:
        return false;
    }
  }
}
