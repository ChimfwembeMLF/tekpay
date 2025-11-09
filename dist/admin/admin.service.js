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
exports.AdminService = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const payment_entity_1 = require("../payments/entities/payment.entity");
const transaction_entity_1 = require("../payments/entities/transaction.entity");
const api_consumer_entity_1 = require("../auth/entities/api-consumer.entity");
const usage_billing_entity_1 = require("../billing/entities/usage-billing.entity");
const payment_enum_1 = require("../common/enums/payment.enum");
const crypto = require("crypto");
const bcrypt = require("bcrypt");
let AdminService = class AdminService {
    constructor(paymentRepository, transactionRepository, apiConsumerRepository, usageBillingRepository) {
        this.paymentRepository = paymentRepository;
        this.transactionRepository = transactionRepository;
        this.apiConsumerRepository = apiConsumerRepository;
        this.usageBillingRepository = usageBillingRepository;
    }
    async getDashboardStats(dateFrom, dateTo) {
        const where = {};
        if (dateFrom && dateTo) {
            where.createdAt = (0, typeorm_2.Between)(dateFrom, dateTo);
        }
        const totalPayments = await this.paymentRepository.count({ where });
        const completedPayments = await this.paymentRepository.count({
            where: { ...where, status: payment_enum_1.PaymentStatus.COMPLETED },
        });
        const failedPayments = await this.paymentRepository.count({
            where: { ...where, status: payment_enum_1.PaymentStatus.FAILED },
        });
        const pendingPayments = await this.paymentRepository.count({
            where: { ...where, status: payment_enum_1.PaymentStatus.PENDING },
        });
        const volumeQuery = this.paymentRepository
            .createQueryBuilder('payment')
            .select('SUM(payment.amount)', 'totalVolume')
            .where('payment.status = :status', { status: payment_enum_1.PaymentStatus.COMPLETED });
        if (dateFrom && dateTo) {
            volumeQuery.andWhere('payment.createdAt BETWEEN :dateFrom AND :dateTo', {
                dateFrom,
                dateTo,
            });
        }
        const { totalVolume } = await volumeQuery.getRawOne();
        const successRate = totalPayments > 0 ? (completedPayments / totalPayments) * 100 : 0;
        const activeConsumers = await this.apiConsumerRepository.count({
            where: { isActive: true },
        });
        return {
            payments: {
                total: totalPayments,
                completed: completedPayments,
                failed: failedPayments,
                pending: pendingPayments,
                successRate: Math.round(successRate * 100) / 100,
            },
            volume: {
                total: parseFloat(totalVolume) || 0,
                currency: 'ZMW',
            },
            consumers: {
                active: activeConsumers,
            },
            period: {
                from: dateFrom,
                to: dateTo,
            },
        };
    }
    async getPaymentTrends(days = 30) {
        const endDate = new Date();
        const startDate = new Date();
        startDate.setDate(startDate.getDate() - days);
        const trends = await this.paymentRepository
            .createQueryBuilder('payment')
            .select([
            'DATE(payment.createdAt) as date',
            'COUNT(*) as count',
            'SUM(CASE WHEN payment.status = :completed THEN payment.amount ELSE 0 END) as volume',
            'COUNT(CASE WHEN payment.status = :completed THEN 1 END) as completed',
            'COUNT(CASE WHEN payment.status = :failed THEN 1 END) as failed',
        ])
            .where('payment.createdAt BETWEEN :startDate AND :endDate', {
            startDate,
            endDate,
        })
            .setParameter('completed', payment_enum_1.PaymentStatus.COMPLETED)
            .setParameter('failed', payment_enum_1.PaymentStatus.FAILED)
            .groupBy('DATE(payment.createdAt)')
            .orderBy('date', 'ASC')
            .getRawMany();
        return trends.map(trend => ({
            date: trend.date,
            count: parseInt(trend.count, 10),
            volume: parseFloat(trend.volume) || 0,
            completed: parseInt(trend.completed, 10),
            failed: parseInt(trend.failed, 10),
            successRate: trend.count > 0 ? (trend.completed / trend.count) * 100 : 0,
        }));
    }
    async getTopConsumers(limit = 10) {
        const consumers = await this.apiConsumerRepository
            .createQueryBuilder('consumer')
            .leftJoin('consumer.payments', 'payment')
            .select([
            'consumer.id',
            'consumer.name',
            'consumer.email',
            'consumer.pricingPlan',
            'COUNT(payment.id) as paymentCount',
            'SUM(CASE WHEN payment.status = :completed THEN payment.amount ELSE 0 END) as totalVolume',
        ])
            .where('consumer.isActive = :isActive', { isActive: true })
            .setParameter('completed', payment_enum_1.PaymentStatus.COMPLETED)
            .groupBy('consumer.id')
            .orderBy('totalVolume', 'DESC')
            .limit(limit)
            .getRawMany();
        return consumers.map(consumer => ({
            id: consumer.consumer_id,
            name: consumer.consumer_name,
            email: consumer.consumer_email,
            pricingPlan: consumer.consumer_pricingPlan,
            paymentCount: parseInt(consumer.paymentCount, 10),
            totalVolume: parseFloat(consumer.totalVolume) || 0,
        }));
    }
    async searchPayments(filters) {
        const queryBuilder = this.paymentRepository
            .createQueryBuilder('payment')
            .leftJoinAndSelect('payment.consumer', 'consumer')
            .leftJoinAndSelect('payment.transactions', 'transactions');
        if (filters.status) {
            queryBuilder.andWhere('payment.status = :status', { status: filters.status });
        }
        if (filters.mno) {
            queryBuilder.andWhere('payment.mno = :mno', { mno: filters.mno });
        }
        if (filters.consumerId) {
            queryBuilder.andWhere('payment.consumerId = :consumerId', {
                consumerId: filters.consumerId
            });
        }
        if (filters.phoneNumber) {
            queryBuilder.andWhere('payment.phoneNumber LIKE :phoneNumber', {
                phoneNumber: `%${filters.phoneNumber}%`
            });
        }
        if (filters.amountMin) {
            queryBuilder.andWhere('payment.amount >= :amountMin', {
                amountMin: filters.amountMin
            });
        }
        if (filters.amountMax) {
            queryBuilder.andWhere('payment.amount <= :amountMax', {
                amountMax: filters.amountMax
            });
        }
        if (filters.dateFrom) {
            queryBuilder.andWhere('payment.createdAt >= :dateFrom', {
                dateFrom: filters.dateFrom
            });
        }
        if (filters.dateTo) {
            queryBuilder.andWhere('payment.createdAt <= :dateTo', {
                dateTo: filters.dateTo
            });
        }
        queryBuilder
            .orderBy('payment.createdAt', 'DESC')
            .limit(filters.limit || 50)
            .offset(filters.offset || 0);
        const [payments, total] = await queryBuilder.getManyAndCount();
        return { payments, total };
    }
    async getClients(filters) {
        const totalQueryBuilder = this.apiConsumerRepository
            .createQueryBuilder('client');
        if (filters.search) {
            totalQueryBuilder.andWhere('(client.name ILIKE :search OR client.email ILIKE :search)', { search: `%${filters.search}%` });
        }
        if (filters.status !== undefined) {
            totalQueryBuilder.andWhere('client.isActive = :status', { status: filters.status });
        }
        const total = await totalQueryBuilder.getCount();
        const queryBuilder = this.apiConsumerRepository
            .createQueryBuilder('client')
            .leftJoin('client.payments', 'payment')
            .select([
            'client.id as id',
            'client.name as name',
            'client.email as email',
            'client.apiKey as "apiKey"',
            'client.pricingPlan as "pricingPlan"',
            'client.isActive as "isActive"',
            'client.createdAt as "createdAt"',
            'client.updatedAt as "updatedAt"',
            'COUNT(payment.id) as "totalPayments"',
            'SUM(CASE WHEN payment.status = :completed THEN payment.amount ELSE 0 END) as "totalVolume"',
            'COUNT(CASE WHEN payment.status = :completed THEN 1 END) as "completedPayments"',
        ])
            .setParameter('completed', payment_enum_1.PaymentStatus.COMPLETED);
        if (filters.search) {
            queryBuilder.andWhere('(client.name ILIKE :search OR client.email ILIKE :search)', { search: `%${filters.search}%` });
        }
        if (filters.status !== undefined) {
            queryBuilder.andWhere('client.isActive = :status', { status: filters.status });
        }
        queryBuilder
            .groupBy('client.id, client.name, client.email, client.apiKey, client.pricingPlan, client.isActive, client.createdAt, client.updatedAt')
            .orderBy('client.createdAt', 'DESC')
            .limit(filters.limit)
            .offset((filters.page - 1) * filters.limit);
        const rawClients = await queryBuilder.getRawMany();
        const clients = rawClients.map(client => ({
            id: client.id,
            name: client.name,
            email: client.email,
            apiKey: this.maskApiKey(client.apiKey),
            pricingPlan: client.pricingPlan,
            isActive: client.isActive,
            createdAt: client.createdAt,
            updatedAt: client.updatedAt,
            totalPayments: parseInt(client.totalPayments, 10) || 0,
            totalVolume: parseFloat(client.totalVolume) || 0,
            successRate: client.totalPayments > 0
                ? Math.round((client.completedPayments / client.totalPayments) * 100 * 100) / 100
                : 0,
        }));
        return {
            clients,
            total,
            page: filters.page,
            totalPages: Math.ceil(total / filters.limit),
        };
    }
    async getClientById(id) {
        const client = await this.apiConsumerRepository
            .createQueryBuilder('client')
            .leftJoin('client.payments', 'payment')
            .select([
            'client.id',
            'client.name',
            'client.email',
            'client.description',
            'client.webhookUrl',
            'client.pricingPlan',
            'client.isActive',
            'client.contactInfo',
            'client.address',
            'client.createdAt',
            'client.updatedAt',
            'client.lastActivityAt',
            'COUNT(payment.id) as totalPayments',
            'SUM(CASE WHEN payment.status = :completed THEN payment.amount ELSE 0 END) as totalVolume',
            'COUNT(CASE WHEN payment.status = :completed THEN 1 END) as completedPayments',
        ])
            .where('client.id = :id', { id })
            .setParameter('completed', payment_enum_1.PaymentStatus.COMPLETED)
            .groupBy('client.id')
            .getRawOne();
        if (!client) {
            throw new common_1.NotFoundException(`Client with ID ${id} not found`);
        }
        return {
            ...client,
            apiKey: this.maskApiKey(client.client_apiKey),
            totalPayments: parseInt(client.totalPayments, 10) || 0,
            totalVolume: parseFloat(client.totalVolume) || 0,
            successRate: client.totalPayments > 0
                ? Math.round((client.completedPayments / client.totalPayments) * 100 * 100) / 100
                : 0,
        };
    }
    async createClient(createClientDto) {
        const existingClient = await this.apiConsumerRepository.findOne({
            where: { email: createClientDto.email },
        });
        if (existingClient) {
            throw new common_1.BadRequestException('Client with this email already exists');
        }
        const apiKey = this.generateApiKey();
        const hashedApiKey = await bcrypt.hash(apiKey, 10);
        const client = this.apiConsumerRepository.create({
            ...createClientDto,
            apiKey: hashedApiKey,
            isActive: createClientDto.isActive ?? true,
            pricingPlan: createClientDto.pricingPlan ?? payment_enum_1.PricingPlan.STANDARD,
        });
        const savedClient = await this.apiConsumerRepository.save(client);
        return {
            ...savedClient,
            apiKey,
        };
    }
    async updateClient(id, updateClientDto) {
        const client = await this.apiConsumerRepository.findOne({ where: { id } });
        if (!client) {
            throw new common_1.NotFoundException(`Client with ID ${id} not found`);
        }
        if (updateClientDto.email && updateClientDto.email !== client.email) {
            const existingClient = await this.apiConsumerRepository.findOne({
                where: { email: updateClientDto.email },
            });
            if (existingClient) {
                throw new common_1.BadRequestException('Client with this email already exists');
            }
        }
        Object.assign(client, updateClientDto);
        client.updatedAt = new Date();
        const updatedClient = await this.apiConsumerRepository.save(client);
        return {
            ...updatedClient,
            apiKey: this.maskApiKey(updatedClient.apiKey),
        };
    }
    async updateClientStatus(id, isActive) {
        const client = await this.apiConsumerRepository.findOne({ where: { id } });
        if (!client) {
            throw new common_1.NotFoundException(`Client with ID ${id} not found`);
        }
        client.isActive = isActive;
        client.updatedAt = new Date();
        const updatedClient = await this.apiConsumerRepository.save(client);
        return {
            ...updatedClient,
            apiKey: this.maskApiKey(updatedClient.apiKey),
        };
    }
    async deleteClient(id) {
        const client = await this.apiConsumerRepository.findOne({ where: { id } });
        if (!client) {
            throw new common_1.NotFoundException(`Client with ID ${id} not found`);
        }
        client.isActive = false;
        client.updatedAt = new Date();
        await this.apiConsumerRepository.save(client);
        return { message: 'Client deactivated successfully' };
    }
    async regenerateApiKey(id) {
        const client = await this.apiConsumerRepository.findOne({ where: { id } });
        if (!client) {
            throw new common_1.NotFoundException(`Client with ID ${id} not found`);
        }
        const newApiKey = this.generateApiKey();
        const hashedApiKey = await bcrypt.hash(newApiKey, 10);
        client.apiKey = hashedApiKey;
        client.updatedAt = new Date();
        await this.apiConsumerRepository.save(client);
        return { apiKey: newApiKey };
    }
    generateApiKey() {
        const prefix = 'tek_live_';
        const randomBytes = crypto.randomBytes(32).toString('hex');
        return prefix + randomBytes;
    }
    maskApiKey(apiKey) {
        if (!apiKey)
            return '';
        const prefix = apiKey.substring(0, 12);
        const suffix = apiKey.substring(apiKey.length - 4);
        const masked = '*'.repeat(apiKey.length - 16);
        return prefix + masked + suffix;
    }
    async getClientAnalytics(filters) {
        const client = await this.getClientById(filters.clientId);
        const where = { consumerId: filters.clientId };
        if (filters.dateFrom && filters.dateTo) {
            where.createdAt = (0, typeorm_2.Between)(filters.dateFrom, filters.dateTo);
        }
        const totalPayments = await this.paymentRepository.count({ where });
        const completedPayments = await this.paymentRepository.count({
            where: { ...where, status: payment_enum_1.PaymentStatus.COMPLETED },
        });
        const failedPayments = await this.paymentRepository.count({
            where: { ...where, status: payment_enum_1.PaymentStatus.FAILED },
        });
        const pendingPayments = await this.paymentRepository.count({
            where: { ...where, status: payment_enum_1.PaymentStatus.PENDING },
        });
        const volumeQuery = this.paymentRepository
            .createQueryBuilder('payment')
            .select('SUM(payment.amount)', 'totalVolume')
            .addSelect('AVG(payment.amount)', 'averageTransaction')
            .where('payment.consumerId = :clientId', { clientId: filters.clientId })
            .andWhere('payment.status = :status', { status: payment_enum_1.PaymentStatus.COMPLETED });
        if (filters.dateFrom && filters.dateTo) {
            volumeQuery.andWhere('payment.createdAt BETWEEN :dateFrom AND :dateTo', {
                dateFrom: filters.dateFrom,
                dateTo: filters.dateTo,
            });
        }
        const volumeResult = await volumeQuery.getRawOne();
        const mnoDistribution = await this.paymentRepository
            .createQueryBuilder('payment')
            .select('payment.mno', 'mno')
            .addSelect('COUNT(*)', 'count')
            .where('payment.consumerId = :clientId', { clientId: filters.clientId })
            .andWhere('payment.status = :status', { status: payment_enum_1.PaymentStatus.COMPLETED })
            .groupBy('payment.mno')
            .getRawMany();
        const endDate = new Date();
        const startDate = new Date();
        startDate.setDate(startDate.getDate() - 30);
        const dailyTrends = await this.paymentRepository
            .createQueryBuilder('payment')
            .select([
            'DATE(payment.createdAt) as date',
            'COUNT(*) as count',
            'SUM(CASE WHEN payment.status = :completed THEN payment.amount ELSE 0 END) as volume',
            'COUNT(CASE WHEN payment.status = :completed THEN 1 END) as completed',
        ])
            .where('payment.consumerId = :clientId', { clientId: filters.clientId })
            .andWhere('payment.createdAt BETWEEN :startDate AND :endDate', {
            startDate,
            endDate,
        })
            .setParameter('completed', payment_enum_1.PaymentStatus.COMPLETED)
            .groupBy('DATE(payment.createdAt)')
            .orderBy('date', 'ASC')
            .getRawMany();
        const currentMonth = new Date();
        const previousMonth = new Date();
        previousMonth.setMonth(previousMonth.getMonth() - 1);
        const currentMonthPeriod = currentMonth.toISOString().slice(0, 7);
        const previousMonthPeriod = previousMonth.toISOString().slice(0, 7);
        const currentMonthUsage = await this.usageBillingRepository.findOne({
            where: {
                consumerId: filters.clientId,
                billingPeriod: currentMonthPeriod,
            },
        });
        const previousMonthUsage = await this.usageBillingRepository.findOne({
            where: {
                consumerId: filters.clientId,
                billingPeriod: previousMonthPeriod,
            },
        });
        return {
            client,
            paymentStats: {
                total: totalPayments,
                completed: completedPayments,
                failed: failedPayments,
                pending: pendingPayments,
                successRate: totalPayments > 0 ? (completedPayments / totalPayments) * 100 : 0,
            },
            volumeStats: {
                total: parseFloat(volumeResult?.totalVolume) || 0,
                currency: 'ZMW',
                averageTransaction: parseFloat(volumeResult?.averageTransaction) || 0,
            },
            mnoDistribution: {
                mtn: mnoDistribution.find(m => m.mno === 'MTN')?.count || 0,
                airtel: mnoDistribution.find(m => m.mno === 'AIRTEL')?.count || 0,
            },
            dailyTrends: dailyTrends.map(trend => ({
                date: trend.date,
                count: parseInt(trend.count, 10),
                volume: parseFloat(trend.volume) || 0,
                successRate: trend.count > 0 ? (trend.completed / trend.count) * 100 : 0,
            })),
            billing: {
                currentMonth: parseFloat(currentMonthUsage?.charges?.toString() || '0'),
                previousMonth: parseFloat(previousMonthUsage?.charges?.toString() || '0'),
                totalCost: parseFloat(currentMonthUsage?.charges?.toString() || '0') + parseFloat(previousMonthUsage?.charges?.toString() || '0'),
            },
        };
    }
    async getClientUsage(clientId, month) {
        const client = await this.apiConsumerRepository.findOne({
            where: { id: clientId },
        });
        if (!client) {
            throw new common_1.NotFoundException('Client not found');
        }
        const targetMonth = month || new Date().toISOString().slice(0, 7);
        const usage = await this.usageBillingRepository.findOne({
            where: {
                consumerId: clientId,
                billingPeriod: targetMonth,
            },
        });
        const startDate = new Date(`${targetMonth}-01`);
        const endDate = new Date(startDate.getFullYear(), startDate.getMonth() + 1, 0);
        const paymentStats = await this.paymentRepository
            .createQueryBuilder('payment')
            .select([
            'COUNT(CASE WHEN payment.status = :completed THEN 1 END) as successful',
            'COUNT(CASE WHEN payment.status = :failed THEN 1 END) as failed',
        ])
            .where('payment.consumerId = :clientId', { clientId })
            .andWhere('payment.createdAt BETWEEN :startDate AND :endDate', {
            startDate,
            endDate,
        })
            .setParameter('completed', payment_enum_1.PaymentStatus.COMPLETED)
            .setParameter('failed', payment_enum_1.PaymentStatus.FAILED)
            .getRawOne();
        if (!usage) {
            return {
                billingPeriod: targetMonth,
                apiCalls: 0,
                successfulTransactions: parseInt(paymentStats?.successful || '0', 10),
                failedTransactions: parseInt(paymentStats?.failed || '0', 10),
                totalVolume: 0,
                totalCost: 0,
                breakdown: {
                    apiCallCost: 0,
                    transactionCost: 0,
                    additionalFees: 0,
                },
            };
        }
        const apiCallCost = usage.apiCalls * 0.02;
        const transactionCost = Math.max(0, parseFloat(usage.charges.toString()) - apiCallCost);
        const additionalFees = 0;
        return {
            billingPeriod: usage.billingPeriod,
            apiCalls: usage.apiCalls,
            successfulTransactions: parseInt(paymentStats?.successful || '0', 10),
            failedTransactions: parseInt(paymentStats?.failed || '0', 10),
            totalVolume: parseFloat(usage.totalVolume.toString()),
            totalCost: parseFloat(usage.charges.toString()),
            breakdown: {
                apiCallCost,
                transactionCost,
                additionalFees,
            },
        };
    }
    async getClientPayments(clientId, filters) {
        const queryBuilder = this.paymentRepository
            .createQueryBuilder('payment')
            .leftJoinAndSelect('payment.consumer', 'consumer')
            .leftJoinAndSelect('payment.transactions', 'transactions')
            .where('payment.consumerId = :clientId', { clientId });
        if (filters.status) {
            queryBuilder.andWhere('payment.status = :status', { status: filters.status });
        }
        queryBuilder
            .orderBy('payment.createdAt', 'DESC')
            .limit(filters.limit)
            .offset((filters.page - 1) * filters.limit);
        const [payments, total] = await queryBuilder.getManyAndCount();
        return {
            payments,
            total,
            page: filters.page,
            totalPages: Math.ceil(total / filters.limit),
        };
    }
    async getSystemHealth() {
        const now = new Date();
        const oneHourAgo = new Date(now.getTime() - 60 * 60 * 1000);
        const recentPayments = await this.paymentRepository.count({
            where: { createdAt: (0, typeorm_2.Between)(oneHourAgo, now) },
        });
        const activeConsumers = await this.apiConsumerRepository.count({
            where: { isActive: true },
        });
        const recentFailures = await this.paymentRepository.count({
            where: {
                status: payment_enum_1.PaymentStatus.FAILED,
                createdAt: (0, typeorm_2.Between)(oneHourAgo, now),
            },
        });
        const recentSuccessful = await this.paymentRepository.count({
            where: {
                status: payment_enum_1.PaymentStatus.COMPLETED,
                createdAt: (0, typeorm_2.Between)(oneHourAgo, now),
            },
        });
        const successRate = recentPayments > 0 ? (recentSuccessful / recentPayments) * 100 : 100;
        let status = 'healthy';
        let issues = [];
        if (successRate < 80) {
            status = 'degraded';
            issues.push('Low success rate detected');
        }
        if (recentFailures > 10) {
            status = 'degraded';
            issues.push('High failure rate detected');
        }
        if (recentPayments === 0) {
            status = 'warning';
            issues.push('No recent payment activity');
        }
        return {
            status,
            timestamp: now,
            metrics: {
                recentPayments,
                activeConsumers,
                recentFailures,
                successRate: Math.round(successRate * 100) / 100,
            },
            issues,
            uptime: process.uptime(),
        };
    }
    async getSystemMetrics(hours = 24) {
        const endDate = new Date();
        const startDate = new Date();
        startDate.setHours(startDate.getHours() - hours);
        const hourlyMetrics = await this.paymentRepository
            .createQueryBuilder('payment')
            .select([
            'EXTRACT(HOUR FROM payment.createdAt) as hour',
            'COUNT(*) as totalPayments',
            'COUNT(CASE WHEN payment.status = :completed THEN 1 END) as successfulPayments',
            'COUNT(CASE WHEN payment.status = :failed THEN 1 END) as failedPayments',
            'AVG(payment.amount) as averageAmount',
        ])
            .where('payment.createdAt BETWEEN :startDate AND :endDate', {
            startDate,
            endDate,
        })
            .setParameter('completed', payment_enum_1.PaymentStatus.COMPLETED)
            .setParameter('failed', payment_enum_1.PaymentStatus.FAILED)
            .groupBy('EXTRACT(HOUR FROM payment.createdAt)')
            .orderBy('hour', 'ASC')
            .getRawMany();
        const responseTimeMetrics = {
            average: 250,
            p95: 500,
            p99: 1000,
        };
        const errorMetrics = await this.paymentRepository
            .createQueryBuilder('payment')
            .leftJoin('payment.transactions', 'transaction')
            .select([
            'transaction.errorCode',
            'COUNT(*) as count',
        ])
            .where('payment.status = :failed', { failed: payment_enum_1.PaymentStatus.FAILED })
            .andWhere('payment.createdAt BETWEEN :startDate AND :endDate', {
            startDate,
            endDate,
        })
            .groupBy('transaction.errorCode')
            .getRawMany();
        return {
            period: {
                from: startDate,
                to: endDate,
                hours,
            },
            hourlyMetrics: hourlyMetrics.map(metric => ({
                hour: parseInt(metric.hour, 10),
                totalPayments: parseInt(metric.totalPayments, 10),
                successfulPayments: parseInt(metric.successfulPayments, 10),
                failedPayments: parseInt(metric.failedPayments, 10),
                averageAmount: parseFloat(metric.averageAmount) || 0,
                successRate: metric.totalPayments > 0
                    ? (metric.successfulPayments / metric.totalPayments) * 100
                    : 0,
            })),
            responseTime: responseTimeMetrics,
            errors: errorMetrics.map(error => ({
                errorCode: error.errorCode || 'UNKNOWN',
                count: parseInt(error.count, 10),
            })),
        };
    }
    async getAlerts(filters) {
        const alerts = [];
        const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
        const recentFailures = await this.paymentRepository.count({
            where: {
                status: payment_enum_1.PaymentStatus.FAILED,
                createdAt: (0, typeorm_2.Between)(oneHourAgo, new Date()),
            },
        });
        if (recentFailures > 5) {
            alerts.push({
                id: 'high-failure-rate',
                severity: 'high',
                title: 'High Failure Rate Detected',
                message: `${recentFailures} failed payments in the last hour`,
                timestamp: new Date(),
                resolved: false,
            });
        }
        const inactiveClientsWithActivity = await this.apiConsumerRepository
            .createQueryBuilder('client')
            .leftJoin('client.payments', 'payment')
            .where('client.isActive = false')
            .andWhere('payment.createdAt > :oneHourAgo', { oneHourAgo })
            .getCount();
        if (inactiveClientsWithActivity > 0) {
            alerts.push({
                id: 'inactive-client-activity',
                severity: 'medium',
                title: 'Inactive Client Activity',
                message: `${inactiveClientsWithActivity} inactive clients attempted payments`,
                timestamp: new Date(),
                resolved: false,
            });
        }
        const filteredAlerts = filters.severity
            ? alerts.filter(alert => alert.severity === filters.severity)
            : alerts;
        return filteredAlerts.slice(0, filters.limit);
    }
};
exports.AdminService = AdminService;
exports.AdminService = AdminService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(payment_entity_1.Payment)),
    __param(1, (0, typeorm_1.InjectRepository)(transaction_entity_1.Transaction)),
    __param(2, (0, typeorm_1.InjectRepository)(api_consumer_entity_1.ApiConsumer)),
    __param(3, (0, typeorm_1.InjectRepository)(usage_billing_entity_1.UsageBilling)),
    __metadata("design:paramtypes", [typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository])
], AdminService);
//# sourceMappingURL=admin.service.js.map