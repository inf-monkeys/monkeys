import { config } from '@/common/config';
import { MigrationInterface, QueryRunner, Table } from 'typeorm';
import { ASSET_COMMON_COLUMNS } from './columns';

const appId = config.server.appId;

export class MigartionAddTableLlmMOdels1719215095828 implements MigrationInterface {
  TABLE_NAME = `${appId}_llm_models`;

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE IF EXISTS ${this.TABLE_NAME}`);
    await queryRunner.createTable(
      new Table({
        name: this.TABLE_NAME,
        columns: [
          ...ASSET_COMMON_COLUMNS,
          {
            name: 'oneapi_channel_type',
            type: 'varchar',
            length: '1024',
            isNullable: true,
          },
          {
            name: 'oneapi_channel_id',
            type: 'integer',
            isNullable: true,
          },
          {
            name: 'oneapi_models',
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
