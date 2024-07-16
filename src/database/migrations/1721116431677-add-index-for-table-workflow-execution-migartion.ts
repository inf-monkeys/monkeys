import { config } from '@/common/config';
import { MigrationInterface, QueryRunner, TableIndex } from 'typeorm';
import { isIndexExist } from './utils';

const appId = config.server.appId;

export class Migartion1721116431677 implements MigrationInterface {
  TABLE_NAME = `${appId}_workflow_execution`;
  INDEX_NAME1 = 'idx_workflow_execution_workflow_id';
  INDEX_COLUMNS1 = ['workflow_id'];
  INDEX_NAME2 = 'idx_workflow_execution_workflow_instance_id';
  INDEX_COLUMNS2 = ['workflow_instance_id'];
  INDEX_NAME3 = 'idx_workflow_execution_workflow_created_timestamp';
  INDEX_COLUMNS3 = ['created_timestamp'];
  INDEX_NAME4 = 'idx_workflow_execution_workflow_status';
  INDEX_COLUMNS4 = ['status'];
  public async up(queryRunner: QueryRunner): Promise<void> {
    const table = await queryRunner.getTable(this.TABLE_NAME);
    const exist1 = await isIndexExist(this.INDEX_NAME1, this.TABLE_NAME, queryRunner);
    if (!exist1) {
      await queryRunner.createIndex(
        table,
        new TableIndex({
          name: this.INDEX_NAME1,
          columnNames: this.INDEX_COLUMNS1,
          isUnique: false,
        }),
      );
    }
    const exist2 = await isIndexExist(this.INDEX_NAME2, this.TABLE_NAME, queryRunner);
    if (!exist2) {
      await queryRunner.createIndex(
        table,
        new TableIndex({
          name: this.INDEX_NAME2,
          columnNames: this.INDEX_COLUMNS2,
          isUnique: false,
        }),
      );
    }
    const exist3 = await isIndexExist(this.INDEX_NAME3, this.TABLE_NAME, queryRunner);
    if (!exist3) {
      await queryRunner.createIndex(
        table,
        new TableIndex({
          name: this.INDEX_NAME3,
          columnNames: this.INDEX_COLUMNS3,
          isUnique: false,
        }),
      );
    }
    const exist4 = await isIndexExist(this.INDEX_NAME4, this.TABLE_NAME, queryRunner);
    if (!exist4) {
      await queryRunner.createIndex(
        table,
        new TableIndex({
          name: this.INDEX_NAME4,
          columnNames: this.INDEX_COLUMNS4,
          isUnique: false,
        }),
      );
    }
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropIndex(this.TABLE_NAME, this.INDEX_NAME1);
    await queryRunner.dropIndex(this.TABLE_NAME, this.INDEX_NAME2);
    await queryRunner.dropIndex(this.TABLE_NAME, this.INDEX_NAME3);
    await queryRunner.dropIndex(this.TABLE_NAME, this.INDEX_NAME4);
  }
}
