import { MigrationInterface, QueryRunner, TableColumn } from 'typeorm';
import { isColumnExist } from '@/database/migrations/utils';
import { TEXT } from '@/database/migrations/columns';
import { config } from '@/common/config';

const appId = config.server.appId;

export class MigartionAddShortcutsFlow1732626882020 implements MigrationInterface {
  TABLE_NAME = `${appId}_workflow_metadatas`;
  COLUMN_NAME = 'shortcuts_flow';
  public async up(queryRunner: QueryRunner): Promise<void> {
    const exists = await isColumnExist(this.COLUMN_NAME, this.TABLE_NAME, queryRunner);
    if (!exists) {
      await queryRunner.addColumn(
        this.TABLE_NAME,
        new TableColumn({
          name: this.COLUMN_NAME,
          comment: 'shortcuts workflow id',
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
