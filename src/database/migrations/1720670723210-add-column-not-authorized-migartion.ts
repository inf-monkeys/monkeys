import { config } from '@/common/config';
import { MigrationInterface, QueryRunner, TableColumn } from 'typeorm';
import { BOOL } from './columns';
import { isColumnExist } from './utils';

const appId = config.server.appId;

export class MigartionAddColoumnNotAuthorized1720670723210 implements MigrationInterface {
  TABLE_NAME = `${appId}_workflow_metadatas`;
  COLUMN_NAME = 'not_authorized';
  public async up(queryRunner: QueryRunner): Promise<void> {
    const exists = await isColumnExist(this.COLUMN_NAME, this.TABLE_NAME, queryRunner);
    if (!exists) {
      await queryRunner.addColumn(
        this.TABLE_NAME,
        new TableColumn({
          name: this.COLUMN_NAME,
          comment: 'Can access without authorization',
          ...BOOL,
          isNullable: true,
          default: false,
        }),
      );
    }
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropColumn(this.TABLE_NAME, this.COLUMN_NAME);
  }
}
