import { Entity, Column, Index } from 'typeorm';
import { BaseEntity } from '@/common/entities/base.entity';

@Entity('audit_logs')
@Index(['resourceType', 'resourceId'])
@Index(['action'])
@Index(['userId'])
export class AuditLog extends BaseEntity {
  @Column()
  action: string;

  @Column({ name: 'resource_type' })
  resourceType: string;

  @Column({ name: 'resource_id', nullable: true })
  resourceId: string;

  @Column({ name: 'user_id', nullable: true })
  userId: string;

  @Column({ name: 'ip_address', nullable: true })
  ipAddress: string;

  @Column({ name: 'user_agent', nullable: true })
  userAgent: string;

  @Column({ type: 'jsonb', nullable: true })
  metadata: any;

  @Column({ name: 'timestamp', type: 'timestamptz', default: () => 'CURRENT_TIMESTAMP' })
  timestamp: Date;
}