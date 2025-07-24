import { config } from '@/common/config';
import { MigrationInterface, QueryRunner } from 'typeorm';

const appId = config.server.appId;
const tableName = `${appId}_workflow_execution`;

export class AddIsTemporaryToWorkflowExecution1753000000000 implements MigrationInterface {
  name = 'AddIsTemporaryToWorkflowExecution1753000000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // 添加 is_temporary 字段
    await queryRunner.query(`
      ALTER TABLE "${tableName}" 
      ADD COLUMN "is_temporary" boolean NOT NULL DEFAULT false
    `);

    // 添加注释
    await queryRunner.query(`
      COMMENT ON COLUMN "${tableName}"."is_temporary" IS '是否为临时工作流执行'
    `);

    // 创建索引以提高查询性能
    await queryRunner.query(`
      CREATE INDEX "idx_${tableName}_is_temporary" ON "${tableName}" ("is_temporary")
    `);

    // 更新现有数据：根据 group 字段判断是否为临时工作流
    await queryRunner.query(`
      UPDATE "${tableName}" 
      SET "is_temporary" = true 
      WHERE "group" LIKE 'temporary-%'
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // 删除索引
    await queryRunner.query(`DROP INDEX IF EXISTS "idx_${tableName}_is_temporary"`);

    // 删除字段
    await queryRunner.query(`
      ALTER TABLE "${tableName}" 
      DROP COLUMN IF EXISTS "is_temporary"
    `);
  }
}
