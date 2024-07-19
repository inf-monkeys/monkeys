import { config } from '@/common/config';
import { MigrationInterface, QueryRunner, TableColumn } from 'typeorm';
import { INT, VARCHAR } from './columns';
import { isColumnExist } from './utils';

const appId = config.server.appId;

export class MigartionAddColumnForWorkflowExecution1721115912596 implements MigrationInterface {
  TABLE_NAME = `${appId}_workflow_execution`;
  COLUMN_NAME1 = 'status';
  COLUMN_NAME2 = 'takes';
  public async up(queryRunner: QueryRunner): Promise<void> {
    const exists1 = await isColumnExist(this.COLUMN_NAME1, this.TABLE_NAME, queryRunner);
    if (!exists1) {
      await queryRunner.addColumn(
        this.TABLE_NAME,
        new TableColumn({
          name: this.COLUMN_NAME1,
          comment: 'Status',
          ...VARCHAR,
          isNullable: true,
          length: '255',
        }),
      );
    }
    const exists2 = await isColumnExist(this.COLUMN_NAME2, this.TABLE_NAME, queryRunner);
    if (!exists2) {
      await queryRunner.addColumn(
        this.TABLE_NAME,
        new TableColumn({
          name: this.COLUMN_NAME2,
          comment: 'Takes in microseconds',
          ...INT,
          isNullable: true,
        }),
      );
    }
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropColumn(this.TABLE_NAME, this.COLUMN_NAME1);
    await queryRunner.dropColumn(this.TABLE_NAME, this.COLUMN_NAME2);
  }
}
