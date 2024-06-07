import { config } from '@/common/config';
import { MigrationInterface, QueryRunner, TableColumn } from 'typeorm';
import { TEXT } from './columns';
import { isColumnExist } from './utils';

const appId = config.server.appId;

export class MigartionAddColumnToolOutputForComfyuiWorkflows1717735898524 implements MigrationInterface {
  TABLE_NAME = `${appId}_comfyui_workflows`;
  COLUMN_NAME = 'tool_output';
  public async up(queryRunner: QueryRunner): Promise<void> {
    const exists = await isColumnExist(this.COLUMN_NAME, this.TABLE_NAME, queryRunner);
    if (!exists) {
      await queryRunner.addColumn(
        this.TABLE_NAME,
        new TableColumn({
          name: this.COLUMN_NAME,
          comment: 'Toll Output',
          ...TEXT,
          isNullable: true,
        }),
      );
    }
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropColumn(this.TABLE_NAME, this.COLUMN_NAME);
  }
}
