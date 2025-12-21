import { config } from '@/common/config';
import { MigrationInterface, QueryRunner, TableColumn } from 'typeorm';
import { NOT_NULL, SMALL_INT } from './columns';
import { isColumnExist } from './utils';

const appId = config.server.appId;

export class AddPinOrderToDataAssets1765900000000 implements MigrationInterface {
  TABLE_NAME = `${appId}_data_assets`;
  COLUMN_NAME = 'pin_order';

  public async up(queryRunner: QueryRunner): Promise<void> {
    const exists = await isColumnExist(this.COLUMN_NAME, this.TABLE_NAME, queryRunner);
    if (exists) return;

    await queryRunner.addColumn(
      this.TABLE_NAME,
      new TableColumn({
        name: this.COLUMN_NAME,
        comment: 'Pin order for assets, higher values appear first',
        default: 0,
        ...SMALL_INT,
        ...NOT_NULL,
      }),
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropColumn(this.TABLE_NAME, this.COLUMN_NAME);
  }
}

