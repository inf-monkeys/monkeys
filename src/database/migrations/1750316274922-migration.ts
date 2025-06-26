import { config } from '@/common/config';
import { MigrationInterface, QueryRunner } from 'typeorm';

const appId = config.server.appId;

export class Migration1750316274922 implements MigrationInterface {
  name = 'Migration1750316274922';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "${appId}_workflow_execution" ADD "extra_metadata" jsonb`);
    await queryRunner.query(`COMMENT ON COLUMN "${appId}_workflow_execution"."extra_metadata" IS 'External metadata from other systems'`);
    await queryRunner.query(`ALTER TABLE "${appId}_workflow_execution" ADD "searchable_text" text`);
    await queryRunner.query(`COMMENT ON COLUMN "${appId}_workflow_execution"."searchable_text" IS 'Flattened string values from input and output for full-text search'`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`COMMENT ON COLUMN "${appId}_workflow_execution"."searchable_text" IS 'Flattened string values from input and output for full-text search'`);
    await queryRunner.query(`ALTER TABLE "${appId}_workflow_execution" DROP COLUMN "searchable_text"`);
    await queryRunner.query(`COMMENT ON COLUMN "${appId}_workflow_execution"."extra_metadata" IS 'External metadata from other systems'`);
    await queryRunner.query(`ALTER TABLE "${appId}_workflow_execution" DROP COLUMN "extra_metadata"`);
  }
}
