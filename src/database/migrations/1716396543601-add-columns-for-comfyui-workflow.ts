import { config } from '@/common/config';
import { MigrationInterface, QueryRunner, TableColumn } from 'typeorm';
import { NULLABLE, TEXT } from './columns';
import { isColumnExist } from './utils';

const appId = config.server.appId;
export class MigartionAddColumnsForComfyuiWorkflow1716396543601 implements MigrationInterface {
  TABLE_NAME = `${appId}_comfyui_workflows`;
  ADDITIONAL_MODEL_LIST_COLUMN_NAME = 'additional_model_list';
  ADDITIONAL_NODE_LIST_COLUMN_NAME = 'additional_node_list';
  public async up(queryRunner: QueryRunner): Promise<void> {
    const additioanlModelListExist = await isColumnExist(this.ADDITIONAL_MODEL_LIST_COLUMN_NAME, this.TABLE_NAME, queryRunner);
    if (!additioanlModelListExist) {
      await queryRunner.addColumn(
        this.TABLE_NAME,
        new TableColumn({
          name: this.ADDITIONAL_MODEL_LIST_COLUMN_NAME,
          comment: 'Additional Model List',
          ...NULLABLE,
          ...TEXT,
        }),
      );
    }

    const additioanlNodeListExist = await isColumnExist(this.ADDITIONAL_NODE_LIST_COLUMN_NAME, this.TABLE_NAME, queryRunner);
    if (!additioanlNodeListExist) {
      await queryRunner.addColumn(
        this.TABLE_NAME,
        new TableColumn({
          name: this.ADDITIONAL_NODE_LIST_COLUMN_NAME,
          comment: 'Additional Node List',
          ...NULLABLE,
          ...TEXT,
        }),
      );
    }
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropColumn(this.TABLE_NAME, this.ADDITIONAL_MODEL_LIST_COLUMN_NAME);
    await queryRunner.dropColumn(this.TABLE_NAME, this.ADDITIONAL_NODE_LIST_COLUMN_NAME);
  }
}
