import { config } from '@/common/config';
import { MigrationInterface, QueryRunner } from 'typeorm';

const appId = config.server.appId;

export class AddVersionTypeToModelTraining1764000000000 implements MigrationInterface {
  name = 'AddVersionTypeToModelTraining1764000000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // 为 model_training 表添加 version_type 字段
    await queryRunner.query(`
      ALTER TABLE "${appId}_model_training" 
      ADD COLUMN IF NOT EXISTS "version_type" integer NOT NULL DEFAULT 1
    `);

    // 为 model_training_config 表添加 version_type 字段
    await queryRunner.query(`
      ALTER TABLE "${appId}_model_training_config" 
      ADD COLUMN IF NOT EXISTS "version_type" integer NOT NULL DEFAULT 1
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // 删除 model_training 表的 version_type 字段
    await queryRunner.query(`
      ALTER TABLE "${appId}_model_training" 
      DROP COLUMN IF EXISTS "version_type"
    `);

    // 删除 model_training_config 表的 version_type 字段
    await queryRunner.query(`
      ALTER TABLE "${appId}_model_training_config" 
      DROP COLUMN IF EXISTS "version_type"
    `);
  }
}
