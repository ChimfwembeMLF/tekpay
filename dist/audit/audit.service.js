"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AuditService = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const audit_log_entity_1 = require("./entities/audit-log.entity");
let AuditService = class AuditService {
    constructor(auditLogRepository) {
        this.auditLogRepository = auditLogRepository;
    }
    async log(entry) {
        const auditLog = this.auditLogRepository.create({
            ...entry,
            timestamp: new Date(),
        });
        await this.auditLogRepository.save(auditLog);
    }
    async findLogs(filters) {
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
};
exports.AuditService = AuditService;
exports.AuditService = AuditService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(audit_log_entity_1.AuditLog)),
    __metadata("design:paramtypes", [typeorm_2.Repository])
], AuditService);
//# sourceMappingURL=audit.service.js.map