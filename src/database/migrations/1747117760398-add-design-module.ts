import { config } from '@/common/config';
import { MigrationInterface, QueryRunner, Table } from 'typeorm';
import { ASSET_COMMON_COLUMNS, COMMON_COLUMNS, DISPLAY_NAME, TEAM_ID } from './columns';
const appId = config.server.appId;
export class AddDesignModule1747117760398 implements MigrationInterface {
  TABLE_NAME1 = `${appId}_design_project`;
  TABLE_NAME2 = `${appId}_design_metadata`;
  public async up(queryRunner: QueryRunner): Promise<void> {
    // design project
    await queryRunner.createTable(
      new Table({
        name: this.TABLE_NAME1,
        columns: [
          ...ASSET_COMMON_COLUMNS,
          {
            name: 'sort_index',
            type: 'integer',
          },
        ],
      }),
    );

    // design metadata
    await queryRunner.createTable(
      new Table({
        name: this.TABLE_NAME2,
        columns: [
          ...COMMON_COLUMNS,
          DISPLAY_NAME,
          TEAM_ID,
          {
            name: 'design_project_id',
            type: 'varchar',
            isNullable: false,
          },
          {
            name: 'snapshot',
            type: 'jsonb',
            isNullable: true,
          },
          {
            name: 'pinned',
            type: 'boolean',
            isNullable: true,
            default: false,
          },
        ],
      }),
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropTable(this.TABLE_NAME1);
    await queryRunner.dropTable(this.TABLE_NAME2);
  }
}
