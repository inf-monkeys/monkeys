import { config } from '@/common/config';
import { MigrationInterface, QueryRunner } from 'typeorm';

const appId = config.server.appId;
const tableName = `${appId}_temporary_workflows`;

export class AddCompleteResultFieldsToTemporaryWorkflow1752000000002 implements MigrationInterface {
  name = 'AddCompleteResultFieldsToTemporaryWorkflow1752000000002';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "${tableName}" 
      ADD COLUMN "raw_input" JSONB,
      ADD COLUMN "formatted_output" JSONB,
      ADD COLUMN "create_time" BIGINT,
      ADD COLUMN "start_time" BIGINT,
      ADD COLUMN "update_time" BIGINT,
      ADD COLUMN "end_time" BIGINT,
      ADD COLUMN "instance_id" VARCHAR,
      ADD COLUMN "extra_metadata" JSONB
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "${tableName}" 
      DROP COLUMN "raw_input",
      DROP COLUMN "formatted_output",
      DROP COLUMN "create_time",
      DROP COLUMN "start_time",
      DROP COLUMN "update_time",
      DROP COLUMN "end_time",
      DROP COLUMN "instance_id",
      DROP COLUMN "extra_metadata"
    `);
  }
}
