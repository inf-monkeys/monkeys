import { config } from '@/common/config';
import { MigrationInterface, QueryRunner } from 'typeorm';

const appId = config.server.appId;
const tableName = `${appId}_temporary_workflows`;

export class UpdateTemporaryWorkflowStatusUppercase1752000000001 implements MigrationInterface {
  name = 'UpdateTemporaryWorkflowStatusUppercase1752000000001';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // 更新现有数据的状态值为大写
    await queryRunner.query(`
      UPDATE "${tableName}" 
      SET status = 
        CASE 
          WHEN status = 'pending' THEN 'PENDING'
          WHEN status = 'running' THEN 'RUNNING'
          WHEN status = 'completed' THEN 'COMPLETED'
          WHEN status = 'failed' THEN 'FAILED'
          ELSE status
        END
    `);

    // 更新默认值
    await queryRunner.query(`
      ALTER TABLE "${tableName}" 
      ALTER COLUMN "status" SET DEFAULT 'PENDING'
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // 回滚：将状态值改回小写
    await queryRunner.query(`
      UPDATE "${tableName}" 
      SET status = 
        CASE 
          WHEN status = 'PENDING' THEN 'pending'
          WHEN status = 'RUNNING' THEN 'running'
          WHEN status = 'COMPLETED' THEN 'completed'
          WHEN status = 'FAILED' THEN 'failed'
          ELSE status
        END
    `);

    // 回滚默认值
    await queryRunner.query(`
      ALTER TABLE "${tableName}" 
      ALTER COLUMN "status" SET DEFAULT 'pending'
    `);
  }
}
