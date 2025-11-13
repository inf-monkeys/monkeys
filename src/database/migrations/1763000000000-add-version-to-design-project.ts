import { config } from '@/common/config';
import { MigrationInterface, QueryRunner } from 'typeorm';

const appId = config.server.appId;

export class AddVersionToDesignProject1763000000000 implements MigrationInterface {
  name = 'AddVersionToDesignProject1763000000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // 添加 project_id 字段（用于标识同一个设计项目的不同版本）
    await queryRunner.query(`ALTER TABLE "${appId}_design_project" ADD "project_id" varchar`);
    
    // 添加 version 字段，默认值为 1，用户可以手动创建新版本
    await queryRunner.query(`ALTER TABLE "${appId}_design_project" ADD "version" integer NOT NULL DEFAULT 1`);
    
    // 为现有数据设置 project_id 和 version
    // 将现有的 id 复制到 project_id，version 设置为 1
    await queryRunner.query(`UPDATE "${appId}_design_project" SET "project_id" = "id", "version" = 1 WHERE "project_id" IS NULL`);
    
    // 设置 project_id 为非空（在有数据后设置）
    await queryRunner.query(`ALTER TABLE "${appId}_design_project" ALTER COLUMN "project_id" SET NOT NULL`);
    
    // 创建复合索引以提高查询性能
    await queryRunner.query(`CREATE INDEX IF NOT EXISTS "IDX_${appId}_design_project_project_id_version" ON "${appId}_design_project" ("project_id", "version")`);
    
    // 创建单独的 project_id 索引
    await queryRunner.query(`CREATE INDEX IF NOT EXISTS "IDX_${appId}_design_project_project_id" ON "${appId}_design_project" ("project_id")`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // 删除索引
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_${appId}_design_project_project_id"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_${appId}_design_project_project_id_version"`);
    
    // 删除字段
    await queryRunner.query(`ALTER TABLE "${appId}_design_project" DROP COLUMN "version"`);
    await queryRunner.query(`ALTER TABLE "${appId}_design_project" DROP COLUMN "project_id"`);
  }
}

