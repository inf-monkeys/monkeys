import { config } from '@/common/config';
import { MigrationInterface, QueryRunner } from 'typeorm';

const appId = config.server.appId;

export class Migration1754579778306 implements MigrationInterface {
  name = 'Migration1754579778306';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "${appId}_workflow_page_group" ADD "preset_relation_id" varchar`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "${appId}_workflow_page_group" DROP COLUMN "preset_relation_id"`);
  }
}
