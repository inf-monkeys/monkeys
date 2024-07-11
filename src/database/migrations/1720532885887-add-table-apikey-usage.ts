import { config } from '@/common/config';
import { MigrationInterface, QueryRunner, Table } from 'typeorm';
import { COMMON_COLUMNS, TEAM_ID } from './columns';

const appId = config.server.appId;

export class MigartionAddTableApiKeyUsage1720532885887 implements MigrationInterface {
  tableName = `${appId}_apikey_usage`;

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.createTable(
      new Table({
        name: this.tableName,
        columns: [
          ...COMMON_COLUMNS,
          TEAM_ID,
          {
            name: 'api_key',
            type: 'varchar',
            length: '64',
          },
          {
            name: 'usage_type',
            type: 'varchar',
            length: '64',
          },
          {
            name: 'extra_info',
            type: 'text',
            isNullable: true,
          },
        ],
      }),
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropTable(this.tableName);
  }
}
