import { config } from '@/common/config';
import { MigrationInterface, QueryRunner, TableColumn } from 'typeorm';
import { TEXT, NULLABLE } from './columns';
import { isColumnExist } from './utils';

const appId = config.server.appId;

export class AddKeywordsToDataAssets1765700000000 implements MigrationInterface {
  TABLE_NAME = `${appId}_data_assets`;
  COLUMN_NAME = 'keywords';

  public async up(queryRunner: QueryRunner): Promise<void> {
    const exists = await isColumnExist(this.COLUMN_NAME, this.TABLE_NAME, queryRunner);
    if (!exists) {
      await queryRunner.addColumn(
        this.TABLE_NAME,
        new TableColumn({
          name: this.COLUMN_NAME,
          comment: 'Keywords for the asset',
          ...TEXT,
          ...NULLABLE,
        }),
      );
    }
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropColumn(this.TABLE_NAME, this.COLUMN_NAME);
  }
}
