"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.InitialSchema1695000000000 = void 0;
class InitialSchema1695000000000 {
    constructor() {
        this.name = 'InitialSchema1695000000000';
    }
    async up(queryRunner) {
        await queryRunner.query(`CREATE EXTENSION IF NOT EXISTS "uuid-ossp"`);
        await queryRunner.query(`
      CREATE TYPE "payment_status_enum" AS ENUM(
        'created', 'initiated', 'pending', 'completed', 
        'settled', 'failed', 'refunded', 'expired'
      )
    `);
        await queryRunner.query(`
      CREATE TYPE "mno_provider_enum" AS ENUM('MTN', 'AIRTEL')
    `);
        await queryRunner.query(`
      CREATE TYPE "currency_enum" AS ENUM('ZMW')
    `);
        await queryRunner.query(`
      CREATE TYPE "pricing_plan_enum" AS ENUM(
        'basic', 'standard', 'premium', 'enterprise'
      )
    `);
        await queryRunner.query(`
      CREATE TYPE "transaction_type_enum" AS ENUM(
        'payment', 'refund', 'fee', 'settlement'
      )
    `);
        await queryRunner.query(`
      CREATE TABLE "api_consumers" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "name" character varying NOT NULL,
        "email" character varying NOT NULL,
        "api_key" character varying NOT NULL,
        "pricing_plan" "pricing_plan_enum" NOT NULL DEFAULT 'standard',
        "monthly_quota" integer NOT NULL DEFAULT '10000',
        "is_active" boolean NOT NULL DEFAULT true,
        "metadata" jsonb,
        "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
        CONSTRAINT "PK_api_consumers" PRIMARY KEY ("id"),
        CONSTRAINT "UQ_api_consumers_name" UNIQUE ("name"),
        CONSTRAINT "UQ_api_consumers_email" UNIQUE ("email"),
        CONSTRAINT "UQ_api_consumers_api_key" UNIQUE ("api_key")
      )
    `);
        await queryRunner.query(`
      CREATE TABLE "payments" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "consumer_id" uuid NOT NULL,
        "external_reference" character varying,
        "amount" numeric(12,2) NOT NULL,
        "currency" "currency_enum" NOT NULL DEFAULT 'ZMW',
        "mno" "mno_provider_enum" NOT NULL,
        "phone_number" character varying NOT NULL,
        "status" "payment_status_enum" NOT NULL DEFAULT 'created',
        "mno_reference" character varying,
        "metadata" jsonb,
        "expires_at" TIMESTAMP WITH TIME ZONE,
        "callback_url" character varying,
        "idempotency_key" character varying,
        "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
        CONSTRAINT "PK_payments" PRIMARY KEY ("id"),
        CONSTRAINT "FK_payments_consumer" FOREIGN KEY ("consumer_id") 
          REFERENCES "api_consumers"("id") ON DELETE RESTRICT ON UPDATE CASCADE
      )
    `);
        await queryRunner.query(`
      CREATE TABLE "transactions" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "payment_id" uuid NOT NULL,
        "type" "transaction_type_enum" NOT NULL,
        "amount" numeric(12,2) NOT NULL,
        "currency" "currency_enum" NOT NULL DEFAULT 'ZMW',
        "status" "payment_status_enum" NOT NULL,
        "mno_reference" character varying,
        "external_reference" character varying,
        "metadata" jsonb,
        "processed_at" TIMESTAMP WITH TIME ZONE,
        "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
        CONSTRAINT "PK_transactions" PRIMARY KEY ("id"),
        CONSTRAINT "FK_transactions_payment" FOREIGN KEY ("payment_id") 
          REFERENCES "payments"("id") ON DELETE CASCADE ON UPDATE CASCADE
      )
    `);
        await queryRunner.query(`
      CREATE TABLE "usage_billing" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "consumer_id" uuid NOT NULL,
        "api_calls" integer NOT NULL DEFAULT '0',
        "total_volume" numeric(12,2) NOT NULL DEFAULT '0',
        "billing_period" character varying NOT NULL,
        "charges" numeric(12,2) NOT NULL DEFAULT '0',
        "last_updated" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
        CONSTRAINT "PK_usage_billing" PRIMARY KEY ("id"),
        CONSTRAINT "FK_usage_billing_consumer" FOREIGN KEY ("consumer_id") 
          REFERENCES "api_consumers"("id") ON DELETE CASCADE ON UPDATE CASCADE,
        CONSTRAINT "UQ_usage_billing_consumer_period" UNIQUE ("consumer_id", "billing_period")
      )
    `);
        await queryRunner.query(`
      CREATE TABLE "audit_logs" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "entity_type" character varying NOT NULL,
        "entity_id" character varying NOT NULL,
        "action" character varying NOT NULL,
        "changes" jsonb,
        "user_id" character varying,
        "ip_address" character varying,
        "user_agent" character varying,
        "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
        CONSTRAINT "PK_audit_logs" PRIMARY KEY ("id")
      )
    `);
        await queryRunner.query(`CREATE INDEX "IDX_payments_consumer_id" ON "payments" ("consumer_id")`);
        await queryRunner.query(`CREATE INDEX "IDX_payments_status" ON "payments" ("status")`);
        await queryRunner.query(`CREATE INDEX "IDX_payments_mno" ON "payments" ("mno")`);
        await queryRunner.query(`CREATE INDEX "IDX_payments_phone_number" ON "payments" ("phone_number")`);
        await queryRunner.query(`CREATE INDEX "IDX_payments_created_at" ON "payments" ("created_at")`);
        await queryRunner.query(`CREATE INDEX "IDX_payments_external_reference" ON "payments" ("external_reference")`);
        await queryRunner.query(`CREATE INDEX "IDX_payments_mno_reference" ON "payments" ("mno_reference")`);
        await queryRunner.query(`CREATE INDEX "IDX_payments_idempotency_key" ON "payments" ("idempotency_key")`);
        await queryRunner.query(`CREATE INDEX "IDX_transactions_payment_id" ON "transactions" ("payment_id")`);
        await queryRunner.query(`CREATE INDEX "IDX_transactions_type" ON "transactions" ("type")`);
        await queryRunner.query(`CREATE INDEX "IDX_transactions_status" ON "transactions" ("status")`);
        await queryRunner.query(`CREATE INDEX "IDX_transactions_created_at" ON "transactions" ("created_at")`);
        await queryRunner.query(`CREATE INDEX "IDX_usage_billing_consumer_id" ON "usage_billing" ("consumer_id")`);
        await queryRunner.query(`CREATE INDEX "IDX_usage_billing_period" ON "usage_billing" ("billing_period")`);
        await queryRunner.query(`CREATE INDEX "IDX_audit_logs_entity" ON "audit_logs" ("entity_type", "entity_id")`);
        await queryRunner.query(`CREATE INDEX "IDX_audit_logs_created_at" ON "audit_logs" ("created_at")`);
        await queryRunner.query(`CREATE INDEX "IDX_audit_logs_user_id" ON "audit_logs" ("user_id")`);
        await queryRunner.query(`CREATE INDEX "IDX_api_consumers_active" ON "api_consumers" ("is_active")`);
        await queryRunner.query(`CREATE INDEX "IDX_api_consumers_pricing_plan" ON "api_consumers" ("pricing_plan")`);
    }
    async down(queryRunner) {
        await queryRunner.query(`DROP INDEX "IDX_api_consumers_pricing_plan"`);
        await queryRunner.query(`DROP INDEX "IDX_api_consumers_active"`);
        await queryRunner.query(`DROP INDEX "IDX_audit_logs_user_id"`);
        await queryRunner.query(`DROP INDEX "IDX_audit_logs_created_at"`);
        await queryRunner.query(`DROP INDEX "IDX_audit_logs_entity"`);
        await queryRunner.query(`DROP INDEX "IDX_usage_billing_period"`);
        await queryRunner.query(`DROP INDEX "IDX_usage_billing_consumer_id"`);
        await queryRunner.query(`DROP INDEX "IDX_transactions_created_at"`);
        await queryRunner.query(`DROP INDEX "IDX_transactions_status"`);
        await queryRunner.query(`DROP INDEX "IDX_transactions_type"`);
        await queryRunner.query(`DROP INDEX "IDX_transactions_payment_id"`);
        await queryRunner.query(`DROP INDEX "IDX_payments_idempotency_key"`);
        await queryRunner.query(`DROP INDEX "IDX_payments_mno_reference"`);
        await queryRunner.query(`DROP INDEX "IDX_payments_external_reference"`);
        await queryRunner.query(`DROP INDEX "IDX_payments_created_at"`);
        await queryRunner.query(`DROP INDEX "IDX_payments_phone_number"`);
        await queryRunner.query(`DROP INDEX "IDX_payments_mno"`);
        await queryRunner.query(`DROP INDEX "IDX_payments_status"`);
        await queryRunner.query(`DROP INDEX "IDX_payments_consumer_id"`);
        await queryRunner.query(`DROP TABLE "audit_logs"`);
        await queryRunner.query(`DROP TABLE "usage_billing"`);
        await queryRunner.query(`DROP TABLE "transactions"`);
        await queryRunner.query(`DROP TABLE "payments"`);
        await queryRunner.query(`DROP TABLE "api_consumers"`);
        await queryRunner.query(`DROP TYPE "transaction_type_enum"`);
        await queryRunner.query(`DROP TYPE "pricing_plan_enum"`);
        await queryRunner.query(`DROP TYPE "currency_enum"`);
        await queryRunner.query(`DROP TYPE "mno_provider_enum"`);
        await queryRunner.query(`DROP TYPE "payment_status_enum"`);
    }
}
exports.InitialSchema1695000000000 = InitialSchema1695000000000;
//# sourceMappingURL=1695000000000-InitialSchema.js.map