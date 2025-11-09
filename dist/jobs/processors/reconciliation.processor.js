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
var ReconciliationProcessor_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.ReconciliationProcessor = void 0;
const bull_1 = require("@nestjs/bull");
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const payment_entity_1 = require("../../payments/entities/payment.entity");
const transaction_entity_1 = require("../../payments/entities/transaction.entity");
const mno_service_1 = require("../../mno/mno.service");
const audit_service_1 = require("../../audit/audit.service");
const payment_enum_1 = require("../../common/enums/payment.enum");
let ReconciliationProcessor = ReconciliationProcessor_1 = class ReconciliationProcessor {
    constructor(paymentRepository, transactionRepository, mnoService, auditService) {
        this.paymentRepository = paymentRepository;
        this.transactionRepository = transactionRepository;
        this.mnoService = mnoService;
        this.auditService = auditService;
        this.logger = new common_1.Logger(ReconciliationProcessor_1.name);
    }
    async handleDailyReconciliation(job) {
        const { date } = job.data;
        const reconciliationDate = date ? new Date(date) : new Date();
        this.logger.log(`Starting daily reconciliation for: ${reconciliationDate.toDateString()}`);
        try {
            const startOfDay = new Date(reconciliationDate);
            startOfDay.setHours(0, 0, 0, 0);
            const endOfDay = new Date(reconciliationDate);
            endOfDay.setHours(23, 59, 59, 999);
            const payments = await this.paymentRepository.find({
                where: {
                    status: payment_enum_1.PaymentStatus.COMPLETED,
                    updatedAt: (0, typeorm_2.Between)(startOfDay, endOfDay),
                },
                relations: ['transactions'],
            });
            let reconciledCount = 0;
            let discrepancyCount = 0;
            for (const payment of payments) {
                try {
                    const mnoStatus = await this.mnoService.checkPaymentStatus(payment.mnoReference, payment.mno);
                    if (mnoStatus.status === 'completed' && payment.status === payment_enum_1.PaymentStatus.COMPLETED) {
                        if (payment.status === payment_enum_1.PaymentStatus.COMPLETED) {
                            payment.status = payment_enum_1.PaymentStatus.SETTLED;
                            await this.paymentRepository.save(payment);
                        }
                        reconciledCount++;
                    }
                    else {
                        discrepancyCount++;
                        await this.auditService.log({
                            action: 'reconciliation.discrepancy',
                            resourceType: 'payment',
                            resourceId: payment.id,
                            metadata: {
                                internalStatus: payment.status,
                                mnoStatus: mnoStatus.status,
                                amount: payment.amount,
                            },
                        });
                    }
                }
                catch (error) {
                    this.logger.error(`Reconciliation failed for payment ${payment.id}:`, error);
                    discrepancyCount++;
                }
            }
            const summary = {
                date: reconciliationDate.toDateString(),
                totalPayments: payments.length,
                reconciled: reconciledCount,
                discrepancies: discrepancyCount,
                timestamp: new Date().toISOString(),
            };
            await this.auditService.log({
                action: 'reconciliation.completed',
                resourceType: 'reconciliation',
                metadata: summary,
            });
            this.logger.log(`Daily reconciliation completed:`, summary);
            return summary;
        }
        catch (error) {
            this.logger.error(`Daily reconciliation failed:`, error);
            await this.auditService.log({
                action: 'reconciliation.failed',
                resourceType: 'reconciliation',
                metadata: { error: error.message, date: reconciliationDate.toDateString() },
            });
            throw error;
        }
    }
    async handlePaymentStatusCheck(job) {
        const { paymentId } = job.data;
        try {
            const payment = await this.paymentRepository.findOne({
                where: { id: paymentId },
            });
            if (!payment || !payment.mnoReference) {
                return;
            }
            const status = await this.mnoService.checkPaymentStatus(payment.mnoReference, payment.mno);
            this.logger.log(`Status check for payment ${paymentId}: ${status.status}`);
            const newStatus = this.mapStatusToInternal(status.status);
            if (newStatus && newStatus !== payment.status) {
                payment.status = newStatus;
                await this.paymentRepository.save(payment);
                await this.auditService.log({
                    action: 'payment.status_updated_by_check',
                    resourceType: 'payment',
                    resourceId: payment.id,
                    metadata: { oldStatus: payment.status, newStatus, mnoStatus: status },
                });
            }
        }
        catch (error) {
            this.logger.error(`Payment status check failed for ${paymentId}:`, error);
            throw error;
        }
    }
    mapStatusToInternal(mnoStatus) {
        const statusMap = {
            'completed': payment_enum_1.PaymentStatus.COMPLETED,
            'failed': payment_enum_1.PaymentStatus.FAILED,
            'pending': payment_enum_1.PaymentStatus.PENDING,
            'cancelled': payment_enum_1.PaymentStatus.FAILED,
            'expired': payment_enum_1.PaymentStatus.EXPIRED,
        };
        return statusMap[mnoStatus.toLowerCase()] || null;
    }
};
exports.ReconciliationProcessor = ReconciliationProcessor;
__decorate([
    (0, bull_1.Process)('daily-reconciliation'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], ReconciliationProcessor.prototype, "handleDailyReconciliation", null);
__decorate([
    (0, bull_1.Process)('payment-status-check'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], ReconciliationProcessor.prototype, "handlePaymentStatusCheck", null);
exports.ReconciliationProcessor = ReconciliationProcessor = ReconciliationProcessor_1 = __decorate([
    (0, bull_1.Processor)('reconciliation'),
    __param(0, (0, typeorm_1.InjectRepository)(payment_entity_1.Payment)),
    __param(1, (0, typeorm_1.InjectRepository)(transaction_entity_1.Transaction)),
    __metadata("design:paramtypes", [typeorm_2.Repository,
        typeorm_2.Repository,
        mno_service_1.MnoService,
        audit_service_1.AuditService])
], ReconciliationProcessor);
//# sourceMappingURL=reconciliation.processor.js.map