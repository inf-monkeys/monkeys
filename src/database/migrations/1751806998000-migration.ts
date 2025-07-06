import { config } from '@/common/config';
import { MigrationInterface, QueryRunner } from 'typeorm';

const appId = config.server.appId;

const tableName = `${appId}_workflow_page_group`;

export class Migration1751806998000 implements MigrationInterface {
  name = 'Migration1751806998000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // 新增临时 jsonb 列
    await queryRunner.query(`
              ALTER TABLE "${tableName}"
              ADD COLUMN "page_ids_tmp" jsonb
          `);

    // 更新临时列 - 修改 CASE 逻辑，增加 JSON 验证和默认空数组
    await queryRunner.query(`
              UPDATE "${tableName}"
              SET "page_ids_tmp" =
                  CASE
                      WHEN "page_ids" IS NOT NULL AND trim("page_ids") <> '' AND 
                           (SELECT json_typeof(NULLIF(trim("page_ids"), '')::json) = 'array')
                      THEN "page_ids"::jsonb
                      ELSE '[]'::jsonb
                  END
          `);

    // 删除原列
    await queryRunner.query(`
              ALTER TABLE "${tableName}"
              DROP COLUMN "page_ids"
          `);

    // 重命名
    await queryRunner.query(`
              ALTER TABLE "${tableName}"
              RENAME COLUMN "page_ids_tmp" TO "page_ids"
          `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // 回滚逻辑：把 jsonb 改回 text

    // 新增临时 text 列
    await queryRunner.query(`
          ALTER TABLE "${tableName}"
          ADD COLUMN "page_ids_tmp" text
      `);

    // 更新
    await queryRunner.query(`
          UPDATE "${tableName}"
          SET "page_ids_tmp" =
              CASE
                  WHEN "page_ids" IS NOT NULL
                  THEN "page_ids"::text
                  ELSE NULL
              END
      `);

    // 删掉 jsonb 列
    await queryRunner.query(`
          ALTER TABLE "${tableName}"
          DROP COLUMN "page_ids"
      `);

    // 重命名
    await queryRunner.query(`
          ALTER TABLE "${tableName}"
          RENAME COLUMN "page_ids_tmp" TO "page_ids"
      `);
  }
}
