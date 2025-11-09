import { Repository } from 'typeorm';
import { AuditLog } from './entities/audit-log.entity';
export interface AuditEntry {
    action: string;
    resourceType: string;
    resourceId?: string;
    userId?: string;
    ipAddress?: string;
    userAgent?: string;
    metadata?: any;
}
export declare class AuditService {
    private readonly auditLogRepository;
    constructor(auditLogRepository: Repository<AuditLog>);
    log(entry: AuditEntry): Promise<void>;
    findLogs(filters: {
        resourceType?: string;
        resourceId?: string;
        userId?: string;
        action?: string;
        dateFrom?: Date;
        dateTo?: Date;
        limit?: number;
        offset?: number;
    }): Promise<{
        logs: AuditLog[];
        total: number;
    }>;
}
