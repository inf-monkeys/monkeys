import { config } from '@/common/config';
import { MigrationInterface, QueryRunner } from 'typeorm';

const appId = config.server.appId;
const table = `${appId}_workflow_page_group`;
export class Migration1749181817165 implements MigrationInterface {
  name = 'Migration1749181817165';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "${table}" ADD "icon_url" character varying`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "${table}" DROP COLUMN "icon_url"`);
  }
}
