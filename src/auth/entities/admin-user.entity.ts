import { Entity, Column } from 'typeorm';
import { BaseEntity } from '@/common/entities/base.entity';

export enum AdminRole {
  ADMIN = 'admin',        // Full access - can manage everything
  MANAGER = 'manager',    // Can manage clients and view analytics
  VIEWER = 'viewer',      // Read-only access to dashboard and reports
}

@Entity('admin_users')
export class AdminUser extends BaseEntity {
  @Column({ unique: true })
  email: string;

  @Column()
  firstName: string;

  @Column()
  lastName: string;

  @Column()
  passwordHash: string;

  @Column({
    type: 'enum',
    enum: AdminRole,
    default: AdminRole.VIEWER,
  })
  role: AdminRole;

  @Column({ default: true })
  isActive: boolean;

  @Column({ nullable: true })
  lastLoginAt: Date;

  // Helper methods
  get fullName(): string {
    return `${this.firstName} ${this.lastName}`;
  }

  get isAdmin(): boolean {
    return this.role === AdminRole.ADMIN;
  }

  get isManager(): boolean {
    return this.role === AdminRole.MANAGER || this.isAdmin;
  }

  get isViewer(): boolean {
    return this.role === AdminRole.VIEWER || this.isManager;
  }

  // Permission checks
  canManageClients(): boolean {
    return this.isManager; // Manager and Admin can manage clients
  }

  canManageSystem(): boolean {
    return this.isAdmin; // Only Admin can manage system settings
  }

  canViewAnalytics(): boolean {
    return this.isViewer; // Everyone can view analytics
  }

  canManageUsers(): boolean {
    return this.isAdmin; // Only Admin can manage users
  }
}
