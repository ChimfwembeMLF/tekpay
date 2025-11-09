import { DataSource } from 'typeorm';
import { ApiConsumer } from '../../auth/entities/api-consumer.entity';
import { PricingPlan } from '../../common/enums/payment.enum';
import { v4 as uuidv4 } from 'uuid';
import * as crypto from 'crypto';

export class InitialDataSeed {
  constructor(private dataSource: DataSource) {}

  async run(): Promise<void> {
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      console.log('🌱 Starting database seeding...');

      // Create default API consumers for testing
      await this.createDefaultConsumers(queryRunner);

      await queryRunner.commitTransaction();
      console.log('✅ Database seeding completed successfully');
    } catch (error) {
      await queryRunner.rollbackTransaction();
      console.error('❌ Database seeding failed:', error);
      throw error;
    } finally {
      await queryRunner.release();
    }
  }

  private async createDefaultConsumers(queryRunner: any): Promise<void> {
    console.log('Creating default API consumers...');

    const consumers = [
      {
        id: uuidv4(),
        name: 'Demo Basic Consumer',
        email: 'demo-basic@tekpay.com',
        apiKey: this.generateApiKey(),
        pricingPlan: PricingPlan.BASIC,
        monthlyQuota: 1000,
        isActive: true,
        metadata: {
          description: 'Demo consumer for basic plan testing',
          createdBy: 'system',
        },
      },
      {
        id: uuidv4(),
        name: 'Demo Standard Consumer',
        email: 'demo-standard@tekpay.com',
        apiKey: this.generateApiKey(),
        pricingPlan: PricingPlan.STANDARD,
        monthlyQuota: 10000,
        isActive: true,
        metadata: {
          description: 'Demo consumer for standard plan testing',
          createdBy: 'system',
        },
      },
      {
        id: uuidv4(),
        name: 'Demo Premium Consumer',
        email: 'demo-premium@tekpay.com',
        apiKey: this.generateApiKey(),
        pricingPlan: PricingPlan.PREMIUM,
        monthlyQuota: 50000,
        isActive: true,
        metadata: {
          description: 'Demo consumer for premium plan testing',
          createdBy: 'system',
        },
      },
      {
        id: uuidv4(),
        name: 'Demo Enterprise Consumer',
        email: 'demo-enterprise@tekpay.com',
        apiKey: this.generateApiKey(),
        pricingPlan: PricingPlan.ENTERPRISE,
        monthlyQuota: 100000,
        isActive: true,
        metadata: {
          description: 'Demo consumer for enterprise plan testing',
          createdBy: 'system',
        },
      },
    ];

    for (const consumer of consumers) {
      await queryRunner.query(`
        INSERT INTO "api_consumers" (
          "id", "name", "email", "api_key", "pricing_plan", 
          "monthly_quota", "is_active", "metadata", "created_at", "updated_at"
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
        ON CONFLICT ("email") DO NOTHING
      `, [
        consumer.id,
        consumer.name,
        consumer.email,
        consumer.apiKey,
        consumer.pricingPlan,
        consumer.monthlyQuota,
        consumer.isActive,
        JSON.stringify(consumer.metadata),
      ]);

      console.log(`✓ Created consumer: ${consumer.name} (${consumer.email})`);
      console.log(`  API Key: ${consumer.apiKey}`);
      console.log(`  Plan: ${consumer.pricingPlan}`);
      console.log(`  Quota: ${consumer.monthlyQuota}`);
      console.log('');
    }
  }

  private generateApiKey(): string {
    const prefix = 'tk_';
    const randomBytes = crypto.randomBytes(16).toString('hex');
    return `${prefix}${randomBytes}`;
  }
}

// CLI runner for the seed
export async function runSeed(dataSource: DataSource): Promise<void> {
  const seed = new InitialDataSeed(dataSource);
  await seed.run();
}

// If this file is run directly
if (require.main === module) {
  import('../typeorm.config').then(async ({ default: dataSource }) => {
    try {
      await dataSource.initialize();
      await runSeed(dataSource);
      await dataSource.destroy();
      process.exit(0);
    } catch (error) {
      console.error('Seed failed:', error);
      process.exit(1);
    }
  });
}
