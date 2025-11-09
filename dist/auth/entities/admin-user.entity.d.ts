import { BaseEntity } from '@/common/entities/base.entity';
export declare enum AdminRole {
    ADMIN = "admin",
    MANAGER = "manager",
    VIEWER = "viewer"
}
export declare class AdminUser extends BaseEntity {
    email: string;
    firstName: string;
    lastName: string;
    passwordHash: string;
    role: AdminRole;
    isActive: boolean;
    lastLoginAt: Date;
    get fullName(): string;
    get isAdmin(): boolean;
    get isManager(): boolean;
    get isViewer(): boolean;
    canManageClients(): boolean;
    canManageSystem(): boolean;
    canViewAnalytics(): boolean;
    canManageUsers(): boolean;
}
