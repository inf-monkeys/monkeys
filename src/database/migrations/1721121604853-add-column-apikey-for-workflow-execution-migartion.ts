import { config } from '@/common/config';
import { MigrationInterface, QueryRunner, TableColumn } from 'typeorm';
import { VARCHAR } from './columns';
import { isColumnExist } from './utils';

const appId = config.server.appId;

export class MigartionAddColumnApiKeyForTableWorkflowExecution1721121604853 implements MigrationInterface {
  TABLE_NAME = `${appId}_workflow_execution`;
  COLUMN_NAME = 'apikey';
  public async up(queryRunner: QueryRunner): Promise<void> {
    const exists = await isColumnExist(this.COLUMN_NAME, this.TABLE_NAME, queryRunner);
    if (!exists) {
      await queryRunner.addColumn(
        this.TABLE_NAME,
        new TableColumn({
          name: this.COLUMN_NAME,
          comment: 'API Key',
          ...VARCHAR,
          isNullable: true,
          length: '255',
        }),
      );
    }
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropColumn(this.TABLE_NAME, this.COLUMN_NAME);
  }
}
