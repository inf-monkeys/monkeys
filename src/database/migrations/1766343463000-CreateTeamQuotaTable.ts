import { config } from '@/common/config';
import { MigrationInterface, QueryRunner } from 'typeorm';

const appId = config.server.appId;

export class CreateTeamQuotaTable1766343463000 implements MigrationInterface {
  name = 'CreateTeamQuotaTable1766343463000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // ========== Create team_quotas table ==========
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "${appId}_team_quotas" (
        "id" varchar(128) PRIMARY KEY,
        "created_timestamp" TIMESTAMP NOT NULL DEFAULT now(),
        "updated_timestamp" TIMESTAMP NOT NULL DEFAULT now(),
        "is_deleted" boolean NOT NULL DEFAULT false,
        "team_id" varchar(128) UNIQUE NOT NULL,
        "daily_tool_call_quota" integer NOT NULL DEFAULT 1000,
        "max_concurrent_tool_calls" integer NOT NULL DEFAULT 10,
        "custom_limits" jsonb,
        "quota_reset_at" TIMESTAMP,
        "current_usage" integer NOT NULL DEFAULT 0,
        "enabled" boolean NOT NULL DEFAULT true
      )
    `);

    // ========== Create indexes for team_quotas ==========
    await queryRunner.query(`
      CREATE UNIQUE INDEX "idx_${appId}_team_quotas_team"
      ON "${appId}_team_quotas" ("team_id")
      WHERE "is_deleted" = false
    `);

    await queryRunner.query(`
      CREATE INDEX "idx_${appId}_team_quotas_enabled"
      ON "${appId}_team_quotas" ("enabled", "is_deleted")
      WHERE "enabled" = true AND "is_deleted" = false
    `);

    await queryRunner.query(`
      CREATE INDEX "idx_${appId}_team_quotas_reset"
      ON "${appId}_team_quotas" ("quota_reset_at")
      WHERE "quota_reset_at" IS NOT NULL AND "is_deleted" = false
    `);

    await queryRunner.query(`
      CREATE INDEX "idx_${appId}_team_quotas_usage"
      ON "${appId}_team_quotas" ("current_usage", "daily_tool_call_quota")
      WHERE "enabled" = true AND "is_deleted" = false
    `);

    // ========== Add foreign key ==========
    await queryRunner.query(`
      ALTER TABLE "${appId}_team_quotas"
      ADD CONSTRAINT "fk_${appId}_team_quotas_team"
      FOREIGN KEY ("team_id") REFERENCES "${appId}_teams"("id")
      ON DELETE CASCADE
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Drop foreign key
    await queryRunner.query(`
      ALTER TABLE "${appId}_team_quotas"
      DROP CONSTRAINT IF EXISTS "fk_${appId}_team_quotas_team"
    `);

    // Drop indexes
    await queryRunner.query(`DROP INDEX IF EXISTS "idx_${appId}_team_quotas_usage"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "idx_${appId}_team_quotas_reset"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "idx_${appId}_team_quotas_enabled"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "idx_${appId}_team_quotas_team"`);

    // Drop table
    await queryRunner.query(`DROP TABLE IF EXISTS "${appId}_team_quotas"`);
  }
}
