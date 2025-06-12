import { config } from '@/common/config';
import { MigrationInterface, QueryRunner } from 'typeorm';

const appId = config.server.appId;

export class Migration1749607839772 implements MigrationInterface {
  name = 'Migration1749607839772';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "${appId}_workflow_page_group" ADD "sort_index" integer`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "${appId}_workflow_page_group" DROP COLUMN "sort_index"`);
  }
}
