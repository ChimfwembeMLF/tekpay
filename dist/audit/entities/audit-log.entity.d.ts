import { BaseEntity } from '@/common/entities/base.entity';
export declare class AuditLog extends BaseEntity {
    action: string;
    resourceType: string;
    resourceId: string;
    userId: string;
    ipAddress: string;
    userAgent: string;
    metadata: any;
    timestamp: Date;
}
