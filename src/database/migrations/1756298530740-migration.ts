import { config } from '@/common/config';
import { MigrationInterface, QueryRunner } from 'typeorm';

const appId = config.server.appId;

export class Migration1756298530740 implements MigrationInterface {
  name = 'Migration1756298530740';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "${appId}_conversation_apps" ADD "mode" character varying(20) DEFAULT 'chat'`);
    await queryRunner.query(`ALTER TABLE "${appId}_conversation_apps" ADD "max_react_steps" integer DEFAULT '10'`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "${appId}_conversation_apps" DROP COLUMN "max_react_steps"`);
    await queryRunner.query(`ALTER TABLE "${appId}_conversation_apps" DROP COLUMN "mode"`);
  }
}
