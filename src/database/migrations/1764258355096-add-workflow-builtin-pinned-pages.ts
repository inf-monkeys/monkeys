import { config } from '@/common/config';
import { COMMON_COLUMNS } from '@/database/migrations/columns';
import { MigrationInterface, QueryRunner, Table } from 'typeorm';

const appId = config.server.appId;

export class AddWorkflowBuiltinPinnedPages1764258355096 implements MigrationInterface {
  TABLE_NAME = `${appId}_workflow_builtin_pinned_pages`;

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.createTable(
      new Table({
        name: this.TABLE_NAME,
        columns: [
          ...COMMON_COLUMNS,
          {
            name: 'workflow_id',
            type: 'varchar',
            length: '1024',
          },
          {
            name: 'page_type',
            type: 'varchar',
            length: '64',
          },
          {
            name: 'group_key',
            type: 'varchar',
            length: '255',
            isNullable: true,
          },
          {
            name: 'sort_index',
            type: 'integer',
            isNullable: true,
          },
        ],
      }),
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropTable(this.TABLE_NAME);
  }
}
