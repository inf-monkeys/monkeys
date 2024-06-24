import { config } from '@/common/config';
import { MigrationInterface, QueryRunner, TableColumn } from 'typeorm';
import { VARCHAR } from './columns';
import { isColumnExist } from './utils';

const appId = config.server.appId;
export class MigartionAddColumnOneApiToken1719200817122 implements MigrationInterface {
  TABLE_NAME = `${appId}_teams`;
  COLUMN1_NAME = 'oneapi_token';
  COLUMN2_NAME = 'oneapi_password';
  public async up(queryRunner: QueryRunner): Promise<void> {
    const exists1 = await isColumnExist(this.COLUMN1_NAME, this.TABLE_NAME, queryRunner);
    if (!exists1) {
      await queryRunner.addColumn(
        this.TABLE_NAME,
        new TableColumn({
          name: this.COLUMN1_NAME,
          comment: 'OneAPI Token',
          ...VARCHAR,
          isNullable: true,
          length: '256',
        }),
      );
    }

    const exists2 = await isColumnExist(this.COLUMN2_NAME, this.TABLE_NAME, queryRunner);
    if (!exists2) {
      await queryRunner.addColumn(
        this.TABLE_NAME,
        new TableColumn({
          name: this.COLUMN2_NAME,
          comment: 'OneAPI Password',
          ...VARCHAR,
          isNullable: true,
          length: '256',
        }),
      );
    }
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropColumn(this.TABLE_NAME, this.COLUMN1_NAME);
  }
}
