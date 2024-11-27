import { MigrationInterface, QueryRunner, TableColumn } from 'typeorm';
import { isColumnExist } from '@/database/migrations/utils';
import { VARCHAR } from '@/database/migrations/columns';

import { config } from '@/common/config';

const appId = config.server.appId;

export class MigartionAddColumnExecutionGroup1732669696629 implements MigrationInterface {
  TABLE_NAME = `${appId}_workflow_execution`;
  COLUMN_NAME = 'group';
  public async up(queryRunner: QueryRunner): Promise<void> {
    const exists = await isColumnExist(this.COLUMN_NAME, this.TABLE_NAME, queryRunner);
    if (!exists) {
      await queryRunner.addColumn(
        this.TABLE_NAME,
        new TableColumn({
          name: this.COLUMN_NAME,
          comment: 'Execution Record Grouping',
          ...VARCHAR,
          isNullable: true,
        }),
      );
    }
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropColumn(this.TABLE_NAME, this.COLUMN_NAME);
  }
}
