import { config } from '@/common/config';
import { MigrationInterface, QueryRunner } from 'typeorm';

const appId = config.server.appId;

export class Migration1755056163658 implements MigrationInterface {
  name = 'Migration1755056163658';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "${appId}_installed_apps" ADD "marketplace_app_id" character varying`);
    await queryRunner.query(`CREATE INDEX "IDX_${appId}_75f808d287a5f370699585d4f2" ON "${appId}_installed_apps" ("marketplace_app_id") `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP INDEX "public"."IDX_${appId}_75f808d287a5f370699585d4f2"`);
    await queryRunner.query(`ALTER TABLE "${appId}_installed_apps" DROP COLUMN "marketplace_app_id"`);
  }
}
