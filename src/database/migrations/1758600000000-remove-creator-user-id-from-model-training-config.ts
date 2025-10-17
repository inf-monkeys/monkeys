import { config } from '@/common/config';
import { MigrationInterface, QueryRunner } from 'typeorm';

const appId = config.server.appId;

export class RemoveCreatorUserIdFromModelTrainingConfig1758600000000 implements MigrationInterface {
  name = 'RemoveCreatorUserIdFromModelTrainingConfig1758600000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // 删除索引
    await queryRunner.query(`
      DROP INDEX IF EXISTS "IDX_${appId}_model_training_config_creator_user_id"
    `);

    // 删除字段
    await queryRunner.query(`
      ALTER TABLE "${appId}_model_training_config" 
      DROP COLUMN IF EXISTS "creator_user_id"
    `);
  }

  public async down(): Promise<void> {
    // 注意：此迁移不可回滚，因为 creator_user_id 字段已被永久删除
    // 如果需要恢复该字段，请创建新的迁移文件
    throw new Error('此迁移不可回滚：creator_user_id 字段已被永久删除');
  }
}
