import { config } from '@/common/config';
import { MigrationInterface, QueryRunner } from 'typeorm';

const appId = config.server.appId;
const tableName = `${appId}_temporary_workflows`;

export class CreateTemporaryWorkflow1752000000000 implements MigrationInterface {
  name = 'CreateTemporaryWorkflow1752000000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE "${tableName}" (
        "id" character varying(128) NOT NULL,
        "created_timestamp" TIMESTAMP NOT NULL DEFAULT now(),
        "updated_timestamp" TIMESTAMP NOT NULL DEFAULT now(),
        "is_deleted" boolean NOT NULL DEFAULT false,
        "temporary_id" character varying(128) NOT NULL,
        "workflow_id" character varying NOT NULL,
        "workflow_version" integer NOT NULL,
        "team_id" character varying NOT NULL,
        "user_id" character varying NOT NULL,
        "workflow_instance_id" character varying,
        "status" character varying NOT NULL DEFAULT 'pending',
        "expires_at" bigint NOT NULL,
        "input_data" jsonb,
        "output_data" jsonb,
        "error_message" text,
        "execution_time" bigint,
        "completion_time" bigint,
        CONSTRAINT "pk_${tableName}" PRIMARY KEY ("id"),
        CONSTRAINT "uk_${tableName}_temporary_id" UNIQUE ("temporary_id")
      )
    `);

    // 创建索引
    await queryRunner.query(`CREATE INDEX "idx_${tableName}_temporary_id" ON "${tableName}" ("temporary_id")`);
    await queryRunner.query(`CREATE INDEX "idx_${tableName}_expires_at" ON "${tableName}" ("expires_at")`);
    await queryRunner.query(`CREATE INDEX "idx_${tableName}_status" ON "${tableName}" ("status")`);
    await queryRunner.query(`CREATE INDEX "idx_${tableName}_team_id" ON "${tableName}" ("team_id")`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE "${tableName}"`);
  }
}
