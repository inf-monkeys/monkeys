import { config } from '@/common/config';
import { MigrationInterface, QueryRunner, Table } from 'typeorm';
import { ASSET_COMMON_COLUMNS } from './columns';

const appId = config.server.appId;

export class MigartionAddTableLLMChannels1718959051307 implements MigrationInterface {
  tableName = `${appId}_llm_channels`;
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.createTable(
      new Table({
        name: this.tableName,
        columns: [
          ...ASSET_COMMON_COLUMNS,
          {
            name: 'properites',
            type: 'text',
          },
        ],
      }),
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropTable(this.tableName);
  }
}
