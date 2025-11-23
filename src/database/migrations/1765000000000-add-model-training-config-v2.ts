import { config } from '@/common/config';
import { MigrationInterface, QueryRunner } from 'typeorm';

const appId = config.server.appId;

export class AddModelTrainingConfigV21765000000000 implements MigrationInterface {
  name = 'AddModelTrainingConfigV21765000000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE "${appId}_model_training_config_v2" (
        "id" character varying(128) NOT NULL,
        "created_timestamp" TIMESTAMP NOT NULL DEFAULT now(),
        "updated_timestamp" TIMESTAMP NOT NULL DEFAULT now(),
        "is_deleted" boolean NOT NULL DEFAULT false,
        "model_training_id" character varying NOT NULL,
        "data" jsonb,
        CONSTRAINT "PK_${appId}_model_training_config_v2" PRIMARY KEY ("id")
      )
    `);

    // 添加外键约束
    await queryRunner.query(`
      ALTER TABLE "${appId}_model_training_config_v2" 
      ADD CONSTRAINT "FK_${appId}_model_training_config_v2_model_training" 
      FOREIGN KEY ("model_training_id") 
      REFERENCES "${appId}_model_training"("id") 
      ON DELETE CASCADE
    `);

    // 添加索引
    await queryRunner.query(`
      CREATE INDEX "IDX_${appId}_model_training_config_v2_model_training_id" 
      ON "${appId}_model_training_config_v2" ("model_training_id")
    `);

    // 创建触发器函数（如果不存在）
    await queryRunner.query(`
      CREATE OR REPLACE FUNCTION update_updated_timestamp()
      RETURNS TRIGGER AS $$
      BEGIN
          NEW.updated_timestamp = now();
          RETURN NEW;
      END;
      $$ language 'plpgsql'
    `);

    // 创建触发器
    await queryRunner.query(`
      CREATE TRIGGER update_${appId}_model_training_config_v2_updated_timestamp 
      BEFORE UPDATE ON "${appId}_model_training_config_v2" 
      FOR EACH ROW EXECUTE FUNCTION update_updated_timestamp()
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // 删除触发器
    await queryRunner.query(`DROP TRIGGER IF EXISTS update_${appId}_model_training_config_v2_updated_timestamp ON "${appId}_model_training_config_v2"`);

    // 删除表（会自动删除触发器）
    await queryRunner.query(`DROP TABLE "${appId}_model_training_config_v2"`);
  }
}

