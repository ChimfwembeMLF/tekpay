import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Between, Like, ILike } from 'typeorm';
import { Payment } from '@/payments/entities/payment.entity';
import { Transaction } from '@/payments/entities/transaction.entity';
import { ApiConsumer } from '@/auth/entities/api-consumer.entity';
import { UsageBilling } from '@/billing/entities/usage-billing.entity';
import { PaymentStatus, PricingPlan } from '@/common/enums/payment.enum';
import { CreateClientDto, UpdateClientDto } from './dto/client.dto';
import * as crypto from 'crypto';
import * as bcrypt from 'bcrypt';

@Injectable()
export class AdminService {
  constructor(
    @InjectRepository(Payment)
    private readonly paymentRepository: Repository<Payment>,
    @InjectRepository(Transaction)
    private readonly transactionRepository: Repository<Transaction>,
    @InjectRepository(ApiConsumer)
    private readonly apiConsumerRepository: Repository<ApiConsumer>,
    @InjectRepository(UsageBilling)
    private readonly usageBillingRepository: Repository<UsageBilling>,
  ) {}

  async getDashboardStats(dateFrom?: Date, dateTo?: Date): Promise<any> {
    const where: any = {};
    
    if (dateFrom && dateTo) {
      where.createdAt = Between(dateFrom, dateTo);
    }

    // Payment statistics
    const totalPayments = await this.paymentRepository.count({ where });
    const completedPayments = await this.paymentRepository.count({
      where: { ...where, status: PaymentStatus.COMPLETED },
    });
    const failedPayments = await this.paymentRepository.count({
      where: { ...where, status: PaymentStatus.FAILED },
    });
    const pendingPayments = await this.paymentRepository.count({
      where: { ...where, status: PaymentStatus.PENDING },
    });

    // Volume statistics
    const volumeQuery = this.paymentRepository
      .createQueryBuilder('payment')
      .select('SUM(payment.amount)', 'totalVolume')
      .where('payment.status = :status', { status: PaymentStatus.COMPLETED });
    
    if (dateFrom && dateTo) {
      volumeQuery.andWhere('payment.createdAt BETWEEN :dateFrom AND :dateTo', {
        dateFrom,
        dateTo,
      });
    }
    
    const { totalVolume } = await volumeQuery.getRawOne();

    // Success rate
    const successRate = totalPayments > 0 ? (completedPayments / totalPayments) * 100 : 0;

    // Active consumers
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

  async getPaymentTrends(days: number = 30): Promise<any> {
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
      .setParameter('completed', PaymentStatus.COMPLETED)
      .setParameter('failed', PaymentStatus.FAILED)
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

  async getTopConsumers(limit: number = 10): Promise<any> {
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
      .setParameter('completed', PaymentStatus.COMPLETED)
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

  async searchPayments(filters: {
    status?: PaymentStatus;
    mno?: string;
    consumerId?: string;
    phoneNumber?: string;
    amountMin?: number;
    amountMax?: number;
    dateFrom?: Date;
    dateTo?: Date;
    limit?: number;
    offset?: number;
  }): Promise<{ payments: Payment[]; total: number }> {
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

  // ==================== CLIENT MANAGEMENT ====================

  async getClients(filters: {
    page: number;
    limit: number;
    search?: string;
    status?: boolean;
  }): Promise<{ clients: any[]; total: number; page: number; totalPages: number }> {
    // Get total count first
    const totalQueryBuilder = this.apiConsumerRepository
      .createQueryBuilder('client');

    if (filters.search) {
      totalQueryBuilder.andWhere(
        '(client.name ILIKE :search OR client.email ILIKE :search)',
        { search: `%${filters.search}%` }
      );
    }

    if (filters.status !== undefined) {
      totalQueryBuilder.andWhere('client.isActive = :status', { status: filters.status });
    }

    const total = await totalQueryBuilder.getCount();

    // Get clients with aggregated data
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
      .setParameter('completed', PaymentStatus.COMPLETED);

    if (filters.search) {
      queryBuilder.andWhere(
        '(client.name ILIKE :search OR client.email ILIKE :search)',
        { search: `%${filters.search}%` }
      );
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

  async getClientById(id: string): Promise<any> {
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
      .setParameter('completed', PaymentStatus.COMPLETED)
      .groupBy('client.id')
      .getRawOne();

    if (!client) {
      throw new NotFoundException(`Client with ID ${id} not found`);
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

  async createClient(createClientDto: CreateClientDto): Promise<any> {
    // Check if email already exists
    const existingClient = await this.apiConsumerRepository.findOne({
      where: { email: createClientDto.email },
    });

    if (existingClient) {
      throw new BadRequestException('Client with this email already exists');
    }

    // Generate API key
    const apiKey = this.generateApiKey();
    const hashedApiKey = await bcrypt.hash(apiKey, 10);

    const client = this.apiConsumerRepository.create({
      ...createClientDto,
      apiKey: hashedApiKey,
      isActive: createClientDto.isActive ?? true,
      pricingPlan: createClientDto.pricingPlan ?? PricingPlan.STANDARD,
    });

    const savedClient = await this.apiConsumerRepository.save(client);

    return {
      ...savedClient,
      apiKey, // Return the plain API key only on creation
    };
  }

  async updateClient(id: string, updateClientDto: UpdateClientDto): Promise<any> {
    const client = await this.apiConsumerRepository.findOne({ where: { id } });

    if (!client) {
      throw new NotFoundException(`Client with ID ${id} not found`);
    }

    // Check if email is being changed and if it already exists
    if (updateClientDto.email && updateClientDto.email !== client.email) {
      const existingClient = await this.apiConsumerRepository.findOne({
        where: { email: updateClientDto.email },
      });

      if (existingClient) {
        throw new BadRequestException('Client with this email already exists');
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

  async updateClientStatus(id: string, isActive: boolean): Promise<any> {
    const client = await this.apiConsumerRepository.findOne({ where: { id } });

    if (!client) {
      throw new NotFoundException(`Client with ID ${id} not found`);
    }

    client.isActive = isActive;
    client.updatedAt = new Date();

    const updatedClient = await this.apiConsumerRepository.save(client);

    return {
      ...updatedClient,
      apiKey: this.maskApiKey(updatedClient.apiKey),
    };
  }

  async deleteClient(id: string): Promise<{ message: string }> {
    const client = await this.apiConsumerRepository.findOne({ where: { id } });

    if (!client) {
      throw new NotFoundException(`Client with ID ${id} not found`);
    }

    // Soft delete by deactivating
    client.isActive = false;
    client.updatedAt = new Date();
    await this.apiConsumerRepository.save(client);

    return { message: 'Client deactivated successfully' };
  }

  async regenerateApiKey(id: string): Promise<{ apiKey: string }> {
    const client = await this.apiConsumerRepository.findOne({ where: { id } });

    if (!client) {
      throw new NotFoundException(`Client with ID ${id} not found`);
    }

    const newApiKey = this.generateApiKey();
    const hashedApiKey = await bcrypt.hash(newApiKey, 10);

    client.apiKey = hashedApiKey;
    client.updatedAt = new Date();

    await this.apiConsumerRepository.save(client);

    return { apiKey: newApiKey };
  }

  private generateApiKey(): string {
    const prefix = 'tek_live_';
    const randomBytes = crypto.randomBytes(32).toString('hex');
    return prefix + randomBytes;
  }

  private maskApiKey(apiKey: string): string {
    if (!apiKey) return '';
    const prefix = apiKey.substring(0, 12); // Show "tek_live_xxx"
    const suffix = apiKey.substring(apiKey.length - 4); // Show last 4 chars
    const masked = '*'.repeat(apiKey.length - 16);
    return prefix + masked + suffix;
  }

  // ==================== CLIENT ANALYTICS ====================

  async getClientAnalytics(filters: {
    clientId: string;
    dateFrom?: Date;
    dateTo?: Date;
  }): Promise<any> {
    const client = await this.getClientById(filters.clientId);

    const where: any = { consumerId: filters.clientId };
    if (filters.dateFrom && filters.dateTo) {
      where.createdAt = Between(filters.dateFrom, filters.dateTo);
    }

    // Payment statistics
    const totalPayments = await this.paymentRepository.count({ where });
    const completedPayments = await this.paymentRepository.count({
      where: { ...where, status: PaymentStatus.COMPLETED },
    });
    const failedPayments = await this.paymentRepository.count({
      where: { ...where, status: PaymentStatus.FAILED },
    });
    const pendingPayments = await this.paymentRepository.count({
      where: { ...where, status: PaymentStatus.PENDING },
    });

    // Volume statistics
    const volumeQuery = this.paymentRepository
      .createQueryBuilder('payment')
      .select('SUM(payment.amount)', 'totalVolume')
      .addSelect('AVG(payment.amount)', 'averageTransaction')
      .where('payment.consumerId = :clientId', { clientId: filters.clientId })
      .andWhere('payment.status = :status', { status: PaymentStatus.COMPLETED });

    if (filters.dateFrom && filters.dateTo) {
      volumeQuery.andWhere('payment.createdAt BETWEEN :dateFrom AND :dateTo', {
        dateFrom: filters.dateFrom,
        dateTo: filters.dateTo,
      });
    }

    const volumeResult = await volumeQuery.getRawOne();

    // MNO distribution
    const mnoDistribution = await this.paymentRepository
      .createQueryBuilder('payment')
      .select('payment.mno', 'mno')
      .addSelect('COUNT(*)', 'count')
      .where('payment.consumerId = :clientId', { clientId: filters.clientId })
      .andWhere('payment.status = :status', { status: PaymentStatus.COMPLETED })
      .groupBy('payment.mno')
      .getRawMany();

    // Daily trends (last 30 days)
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
      .setParameter('completed', PaymentStatus.COMPLETED)
      .groupBy('DATE(payment.createdAt)')
      .orderBy('date', 'ASC')
      .getRawMany();

    // Billing information
    const currentMonth = new Date();
    const previousMonth = new Date();
    previousMonth.setMonth(previousMonth.getMonth() - 1);

    const currentMonthPeriod = currentMonth.toISOString().slice(0, 7); // YYYY-MM
    const previousMonthPeriod = previousMonth.toISOString().slice(0, 7); // YYYY-MM

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

  async getClientUsage(clientId: string, month?: string): Promise<any> {
    const client = await this.apiConsumerRepository.findOne({
      where: { id: clientId },
    });

    if (!client) {
      throw new NotFoundException('Client not found');
    }

    // Default to current month if not specified
    const targetMonth = month || new Date().toISOString().slice(0, 7); // YYYY-MM format

    const usage = await this.usageBillingRepository.findOne({
      where: {
        consumerId: clientId,
        billingPeriod: targetMonth,
      },
    });

    // Get payment stats for the month
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
      .setParameter('completed', PaymentStatus.COMPLETED)
      .setParameter('failed', PaymentStatus.FAILED)
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

    const apiCallCost = usage.apiCalls * 0.02; // Example: $0.02 per API call
    const transactionCost = Math.max(0, parseFloat(usage.charges.toString()) - apiCallCost);
    const additionalFees = 0; // No additional fees for now

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

  async getClientPayments(
    clientId: string,
    filters: {
      page: number;
      limit: number;
      status?: PaymentStatus;
    }
  ): Promise<{ payments: Payment[]; total: number; page: number; totalPages: number }> {
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

  // ==================== SYSTEM MONITORING ====================

  async getSystemHealth(): Promise<any> {
    const now = new Date();
    const oneHourAgo = new Date(now.getTime() - 60 * 60 * 1000);

    // Check recent payment activity
    const recentPayments = await this.paymentRepository.count({
      where: { createdAt: Between(oneHourAgo, now) },
    });

    // Check active consumers
    const activeConsumers = await this.apiConsumerRepository.count({
      where: { isActive: true },
    });

    // Check recent failures
    const recentFailures = await this.paymentRepository.count({
      where: {
        status: PaymentStatus.FAILED,
        createdAt: Between(oneHourAgo, now),
      },
    });

    // Calculate success rate for last hour
    const recentSuccessful = await this.paymentRepository.count({
      where: {
        status: PaymentStatus.COMPLETED,
        createdAt: Between(oneHourAgo, now),
      },
    });

    const successRate = recentPayments > 0 ? (recentSuccessful / recentPayments) * 100 : 100;

    // Determine overall health status
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

  async getSystemMetrics(hours: number = 24): Promise<any> {
    const endDate = new Date();
    const startDate = new Date();
    startDate.setHours(startDate.getHours() - hours);

    // Hourly metrics
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
      .setParameter('completed', PaymentStatus.COMPLETED)
      .setParameter('failed', PaymentStatus.FAILED)
      .groupBy('EXTRACT(HOUR FROM payment.createdAt)')
      .orderBy('hour', 'ASC')
      .getRawMany();

    // Response time metrics (simulated - you'd implement actual response time tracking)
    const responseTimeMetrics = {
      average: 250, // ms
      p95: 500,
      p99: 1000,
    };

    // Error rate by type
    const errorMetrics = await this.paymentRepository
      .createQueryBuilder('payment')
      .leftJoin('payment.transactions', 'transaction')
      .select([
        'transaction.errorCode',
        'COUNT(*) as count',
      ])
      .where('payment.status = :failed', { failed: PaymentStatus.FAILED })
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

  async getAlerts(filters: {
    severity?: string;
    limit: number;
  }): Promise<any[]> {
    // This is a simplified implementation
    // In a real system, you'd have an alerts table
    const alerts = [];

    // Check for high failure rates
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
    const recentFailures = await this.paymentRepository.count({
      where: {
        status: PaymentStatus.FAILED,
        createdAt: Between(oneHourAgo, new Date()),
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

    // Check for inactive clients with recent activity attempts
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

    // Filter by severity if specified
    const filteredAlerts = filters.severity
      ? alerts.filter(alert => alert.severity === filters.severity)
      : alerts;

    return filteredAlerts.slice(0, filters.limit);
  }
}