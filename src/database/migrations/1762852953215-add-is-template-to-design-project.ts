import { config } from '@/common/config';
import { MigrationInterface, QueryRunner } from 'typeorm';

const appId = config.server.appId;

export class AddIsTemplateToDesignProject1762852953215 implements MigrationInterface {
  name = 'AddIsTemplateToDesignProject1762852953215';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "${appId}_design_project" ADD "is_template" boolean NOT NULL DEFAULT false`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "${appId}_design_project" DROP COLUMN "is_template"`);
  }
}
