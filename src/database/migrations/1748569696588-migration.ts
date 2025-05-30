import { MigrationInterface, QueryRunner } from 'typeorm';

import { config } from '@/common/config';
const appId = config.server.appId;

const tables = [`${appId}_design_metadata`, `${appId}_design_project`];

async function convertTimestampColumns(queryRunner: QueryRunner, tableName: string, operation: 'up' | 'down') {
    if (operation === 'up') {
        // 1. 添加新的临时时间戳列
        await queryRunner.query(`
            ALTER TABLE "${tableName}" 
            ADD COLUMN "created_timestamp_new" TIMESTAMP,
            ADD COLUMN "updated_timestamp_new" TIMESTAMP
        `);

        // 2. 转换并复制数据 (将毫秒转换为时间戳)
        await queryRunner.query(`
            UPDATE "${tableName}" 
            SET "created_timestamp_new" = to_timestamp(CAST(created_timestamp AS DOUBLE PRECISION) / 1000),
                "updated_timestamp_new" = to_timestamp(CAST(updated_timestamp AS DOUBLE PRECISION) / 1000)
        `);

        // 3. 删除旧列
        await queryRunner.query(`
            ALTER TABLE "${tableName}" 
            DROP COLUMN "created_timestamp",
            DROP COLUMN "updated_timestamp"
        `);

        // 4. 重命名新列
        await queryRunner.query(`
            ALTER TABLE "${tableName}" 
            RENAME COLUMN "created_timestamp_new" TO "created_timestamp";
            ALTER TABLE "${tableName}" 
            RENAME COLUMN "updated_timestamp_new" TO "updated_timestamp"
        `);

        // 5. 设置默认值和非空约束
        await queryRunner.query(`
            ALTER TABLE "${tableName}" 
            ALTER COLUMN "created_timestamp" SET NOT NULL,
            ALTER COLUMN "created_timestamp" SET DEFAULT now(),
            ALTER COLUMN "updated_timestamp" SET NOT NULL,
            ALTER COLUMN "updated_timestamp" SET DEFAULT now()
        `);
    } else {
        // 1. 添加新的临时 bigint 列
        await queryRunner.query(`
            ALTER TABLE "${tableName}" 
            ADD COLUMN "created_timestamp_new" bigint,
            ADD COLUMN "updated_timestamp_new" bigint
        `);

        // 2. 转换并复制数据 (将时间戳转换为毫秒)
        await queryRunner.query(`
            UPDATE "${tableName}" 
            SET "created_timestamp_new" = (EXTRACT(EPOCH FROM created_timestamp) * 1000)::bigint,
                "updated_timestamp_new" = (EXTRACT(EPOCH FROM updated_timestamp) * 1000)::bigint
        `);

        // 3. 删除旧列
        await queryRunner.query(`
            ALTER TABLE "${tableName}" 
            DROP COLUMN "created_timestamp",
            DROP COLUMN "updated_timestamp"
        `);

        // 4. 重命名新列
        await queryRunner.query(`
            ALTER TABLE "${tableName}" 
            RENAME COLUMN "created_timestamp_new" TO "created_timestamp";
            ALTER TABLE "${tableName}" 
            RENAME COLUMN "updated_timestamp_new" TO "updated_timestamp"
        `);

        // 5. 设置默认值和非空约束
        await queryRunner.query(`
            ALTER TABLE "${tableName}" 
            ALTER COLUMN "created_timestamp" SET NOT NULL,
            ALTER COLUMN "created_timestamp" SET DEFAULT '1748344775167',
            ALTER COLUMN "updated_timestamp" SET NOT NULL,
            ALTER COLUMN "updated_timestamp" SET DEFAULT '1748344775167'
        `);
    }
}
export class Migration1748569696588 implements MigrationInterface {
    name = 'Migration1748569696588';

    public async up(queryRunner: QueryRunner): Promise<void> {
        for (const table of tables) {
            await convertTimestampColumns(queryRunner, table, 'up');
        }
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        for (const table of tables) {
            await convertTimestampColumns(queryRunner, table, 'down');
        }
    }
}
