import { config } from '@/common/config';
import { MigrationInterface, QueryRunner } from 'typeorm';

const appId = config.server.appId;

/**
 * 将 workflow_builtin_pinned_pages 表中的 created_timestamp / updated_timestamp
 * 从 bigint 调整为 timestamp，以兼容 BaseEntity 上的 TimestampTransformer。
 */
export class FixWorkflowBuiltinPinnedPagesTimestamp1766500000001 implements MigrationInterface {
  TABLE_NAME = `${appId}_workflow_builtin_pinned_pages`;

  public async up(queryRunner: QueryRunner): Promise<void> {
    // 如果表不存在，直接跳过（说明还没创建，不需要修复）
    const tableExists = await queryRunner.hasTable(this.TABLE_NAME);
    if (!tableExists) return;

    // 先移除默认值，避免类型转换时 PostgreSQL 无法自动转换 DEFAULT 表达式
    await queryRunner.query(
      `ALTER TABLE "${this.TABLE_NAME}" ALTER COLUMN "created_timestamp" DROP DEFAULT`,
    );
    await queryRunner.query(
      `ALTER TABLE "${this.TABLE_NAME}" ALTER COLUMN "updated_timestamp" DROP DEFAULT`,
    );

    // 将 bigint 毫秒时间戳转换为 timestamp
    await queryRunner.query(
      `ALTER TABLE "${this.TABLE_NAME}" ALTER COLUMN "created_timestamp" TYPE TIMESTAMP USING to_timestamp(("created_timestamp")::bigint / 1000)`,
    );
    await queryRunner.query(
      `ALTER TABLE "${this.TABLE_NAME}" ALTER COLUMN "updated_timestamp" TYPE TIMESTAMP USING to_timestamp(("updated_timestamp")::bigint / 1000)`,
    );

    // 调整默认值为 now()
    await queryRunner.query(
      `ALTER TABLE "${this.TABLE_NAME}" ALTER COLUMN "created_timestamp" SET DEFAULT now()`,
    );
    await queryRunner.query(
      `ALTER TABLE "${this.TABLE_NAME}" ALTER COLUMN "updated_timestamp" SET DEFAULT now()`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    const tableExists = await queryRunner.hasTable(this.TABLE_NAME);
    if (!tableExists) return;

    // 回滚时将 timestamp 转回 bigint（单位毫秒）
    await queryRunner.query(
      `ALTER TABLE "${this.TABLE_NAME}" ALTER COLUMN "created_timestamp" DROP DEFAULT`,
    );
    await queryRunner.query(
      `ALTER TABLE "${this.TABLE_NAME}" ALTER COLUMN "updated_timestamp" DROP DEFAULT`,
    );

    await queryRunner.query(
      `ALTER TABLE "${this.TABLE_NAME}" ALTER COLUMN "created_timestamp" TYPE bigint USING (EXTRACT(EPOCH FROM "created_timestamp") * 1000)::bigint`,
    );
    await queryRunner.query(
      `ALTER TABLE "${this.TABLE_NAME}" ALTER COLUMN "updated_timestamp" TYPE bigint USING (EXTRACT(EPOCH FROM "updated_timestamp") * 1000)::bigint`,
    );

    // 还原默认值为当前时间戳（毫秒级）
    await queryRunner.query(
      `ALTER TABLE "${this.TABLE_NAME}" ALTER COLUMN "created_timestamp" SET DEFAULT (EXTRACT(EPOCH FROM now()) * 1000)::bigint`,
    );
    await queryRunner.query(
      `ALTER TABLE "${this.TABLE_NAME}" ALTER COLUMN "updated_timestamp" SET DEFAULT (EXTRACT(EPOCH FROM now()) * 1000)::bigint`,
    );
  }
}


