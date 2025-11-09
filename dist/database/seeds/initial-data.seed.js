"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.InitialDataSeed = void 0;
exports.runSeed = runSeed;
const payment_enum_1 = require("../../common/enums/payment.enum");
const uuid_1 = require("uuid");
const crypto = require("crypto");
class InitialDataSeed {
    constructor(dataSource) {
        this.dataSource = dataSource;
    }
    async run() {
        const queryRunner = this.dataSource.createQueryRunner();
        await queryRunner.connect();
        await queryRunner.startTransaction();
        try {
            console.log('🌱 Starting database seeding...');
            await this.createDefaultConsumers(queryRunner);
            await queryRunner.commitTransaction();
            console.log('✅ Database seeding completed successfully');
        }
        catch (error) {
            await queryRunner.rollbackTransaction();
            console.error('❌ Database seeding failed:', error);
            throw error;
        }
        finally {
            await queryRunner.release();
        }
    }
    async createDefaultConsumers(queryRunner) {
        console.log('Creating default API consumers...');
        const consumers = [
            {
                id: (0, uuid_1.v4)(),
                name: 'Demo Basic Consumer',
                email: 'demo-basic@tekpay.com',
                apiKey: this.generateApiKey(),
                pricingPlan: payment_enum_1.PricingPlan.BASIC,
                monthlyQuota: 1000,
                isActive: true,
                metadata: {
                    description: 'Demo consumer for basic plan testing',
                    createdBy: 'system',
                },
            },
            {
                id: (0, uuid_1.v4)(),
                name: 'Demo Standard Consumer',
                email: 'demo-standard@tekpay.com',
                apiKey: this.generateApiKey(),
                pricingPlan: payment_enum_1.PricingPlan.STANDARD,
                monthlyQuota: 10000,
                isActive: true,
                metadata: {
                    description: 'Demo consumer for standard plan testing',
                    createdBy: 'system',
                },
            },
            {
                id: (0, uuid_1.v4)(),
                name: 'Demo Premium Consumer',
                email: 'demo-premium@tekpay.com',
                apiKey: this.generateApiKey(),
                pricingPlan: payment_enum_1.PricingPlan.PREMIUM,
                monthlyQuota: 50000,
                isActive: true,
                metadata: {
                    description: 'Demo consumer for premium plan testing',
                    createdBy: 'system',
                },
            },
            {
                id: (0, uuid_1.v4)(),
                name: 'Demo Enterprise Consumer',
                email: 'demo-enterprise@tekpay.com',
                apiKey: this.generateApiKey(),
                pricingPlan: payment_enum_1.PricingPlan.ENTERPRISE,
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
    generateApiKey() {
        const prefix = 'tk_';
        const randomBytes = crypto.randomBytes(16).toString('hex');
        return `${prefix}${randomBytes}`;
    }
}
exports.InitialDataSeed = InitialDataSeed;
async function runSeed(dataSource) {
    const seed = new InitialDataSeed(dataSource);
    await seed.run();
}
if (require.main === module) {
    Promise.resolve().then(() => require('../typeorm.config')).then(async ({ default: dataSource }) => {
        try {
            await dataSource.initialize();
            await runSeed(dataSource);
            await dataSource.destroy();
            process.exit(0);
        }
        catch (error) {
            console.error('Seed failed:', error);
            process.exit(1);
        }
    });
}
//# sourceMappingURL=initial-data.seed.js.map