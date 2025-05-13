import { config } from '@/common/config';
import { MigrationInterface, QueryRunner, Table } from 'typeorm';
import { COMMON_COLUMNS } from './columns';
const appId = config.server.appId;
export class AddDesignModule1747117760398 implements MigrationInterface {
  TABLE_NAME = `${appId}_designs`;
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.createTable(
      new Table({
        name: this.TABLE_NAME,
        columns: [
          ...COMMON_COLUMNS,
          {
            name: 'team_id',
            type: 'varchar',
          },
          {
            name: 'design_snapshot',
            type: 'jsonb',
          },
          {
            name: 'name',
            type: 'varchar',
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
