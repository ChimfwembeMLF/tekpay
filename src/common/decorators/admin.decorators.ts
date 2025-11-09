import { SetMetadata, applyDecorators, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { AdminGuard } from '../guards/admin.guard';
import { AdminRole } from '@/auth/entities/admin-user.entity';
import { ApiBearerAuth, ApiUnauthorizedResponse, ApiForbiddenResponse } from '@nestjs/swagger';

// Base admin authentication
export const AdminAuth = () =>
  applyDecorators(
    UseGuards(AuthGuard('admin-jwt'), AdminGuard),
    ApiBearerAuth(),
    ApiUnauthorizedResponse({ description: 'Unauthorized' }),
    ApiForbiddenResponse({ description: 'Insufficient privileges' }),
  );

// Role-specific decorators
export const RequireRole = (role: AdminRole) => SetMetadata('adminRole', role);

export const AdminOnly = () =>
  applyDecorators(
    RequireRole(AdminRole.ADMIN),
    AdminAuth(),
  );

export const ManagerOrAbove = () =>
  applyDecorators(
    RequireRole(AdminRole.MANAGER),
    AdminAuth(),
  );

export const ViewerOrAbove = () =>
  applyDecorators(
    RequireRole(AdminRole.VIEWER),
    AdminAuth(),
  );

// Convenience decorators for common actions
export const CanManageClients = () => ManagerOrAbove();
export const CanManageSystem = () => AdminOnly();
export const CanViewAnalytics = () => ViewerOrAbove();
export const CanManageUsers = () => AdminOnly();
