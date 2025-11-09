import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
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

@Injectable()
export class AuditService {
  constructor(
    @InjectRepository(AuditLog)
    private readonly auditLogRepository: Repository<AuditLog>,
  ) {}

  async log(entry: AuditEntry): Promise<void> {
    const auditLog = this.auditLogRepository.create({
      ...entry,
      timestamp: new Date(),
    });

    await this.auditLogRepository.save(auditLog);
  }

  async findLogs(filters: {
    resourceType?: string;
    resourceId?: string;
    userId?: string;
    action?: string;
    dateFrom?: Date;
    dateTo?: Date;
    limit?: number;
    offset?: number;
  }): Promise<{ logs: AuditLog[]; total: number }> {
    const queryBuilder = this.auditLogRepository.createQueryBuilder('log');

    if (filters.resourceType) {
      queryBuilder.andWhere('log.resourceType = :resourceType', { 
        resourceType: filters.resourceType 
      });
    }

    if (filters.resourceId) {
      queryBuilder.andWhere('log.resourceId = :resourceId', { 
        resourceId: filters.resourceId 
      });
    }

    if (filters.userId) {
      queryBuilder.andWhere('log.userId = :userId', { 
        userId: filters.userId 
      });
    }

    if (filters.action) {
      queryBuilder.andWhere('log.action ILIKE :action', { 
        action: `%${filters.action}%` 
      });
    }

    if (filters.dateFrom) {
      queryBuilder.andWhere('log.timestamp >= :dateFrom', { 
        dateFrom: filters.dateFrom 
      });
    }

    if (filters.dateTo) {
      queryBuilder.andWhere('log.timestamp <= :dateTo', { 
        dateTo: filters.dateTo 
      });
    }

    queryBuilder
      .orderBy('log.timestamp', 'DESC')
      .limit(filters.limit || 100)
      .offset(filters.offset || 0);

    const [logs, total] = await queryBuilder.getManyAndCount();

    return { logs, total };
  }
}