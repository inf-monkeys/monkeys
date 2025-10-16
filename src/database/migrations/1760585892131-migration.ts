import { config } from '@/common/config';
import { MigrationInterface, QueryRunner } from 'typeorm';

const appId = config.server.appId;

export class Migration1760585892131 implements MigrationInterface {
  name = 'Migration1760585892131';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`CREATE TYPE "public"."${appId}_teams_init_status_enum" AS ENUM('PENDING', 'SUCCESS', 'FAILED')`);
    await queryRunner.query(`ALTER TABLE "${appId}_teams" ADD "init_status" "public"."${appId}_teams_init_status_enum"`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "${appId}_teams" DROP COLUMN "init_status"`);
    await queryRunner.query(`DROP TYPE "public"."${appId}_teams_init_status_enum"`);
  }
}
