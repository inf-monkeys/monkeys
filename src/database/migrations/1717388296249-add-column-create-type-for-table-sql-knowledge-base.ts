import { config } from '@/common/config';
import { MigrationInterface, QueryRunner, TableColumn } from 'typeorm';
import { VARCHAR } from './columns';
import { isColumnExist } from './utils';

const appId = config.server.appId;

export class MigartionAddColumnCreateTypeForTableSqlKnowledgeBase1717388296249 implements MigrationInterface {
  TABLE_NAME = `${appId}_knowledge_bases_sql`;
  COLUMN_NAME = 'create_type';
  public async up(queryRunner: QueryRunner): Promise<void> {
    const exists = await isColumnExist(this.COLUMN_NAME, this.TABLE_NAME, queryRunner);
    if (!exists) {
      await queryRunner.addColumn(
        this.TABLE_NAME,
        new TableColumn({
          name: this.COLUMN_NAME,
          comment: 'Create Type',
          ...VARCHAR,
          length: '255',
          default: "'builtIn'",
        }),
      );
    }
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropColumn(this.TABLE_NAME, this.COLUMN_NAME);
  }
}
