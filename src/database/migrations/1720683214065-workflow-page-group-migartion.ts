import { MigrationInterface, QueryRunner, Table } from 'typeorm';
import { config } from '@/common/config';
import { COMMON_COLUMNS } from '@/database/migrations/columns';

const appId = config.server.appId;
export class MigartionWorkflowPageGroup1720683214065 implements MigrationInterface {
  TABLE_NAME = `${appId}_workflow_page_group`;

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.createTable(
      new Table({
        name: this.TABLE_NAME,
        columns: [
          ...COMMON_COLUMNS,
          {
            name: 'display_name',
            type: 'varchar',
            length: '1024',
          },
          {
            name: 'team_id',
            type: 'varchar',
            length: '1024',
          },
          {
            name: 'is_builtin',
            type: 'boolean',
            default: false,
          },
          {
            name: 'page_ids',
            type: 'text',
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
