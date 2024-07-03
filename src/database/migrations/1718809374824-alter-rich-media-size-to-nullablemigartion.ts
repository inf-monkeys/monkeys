import { config } from '@/common/config';
import { MigrationInterface, QueryRunner } from 'typeorm';

const appId = config.server.appId;
export class MigartionAlterRichMediaSizeNullAble1718809374824 implements MigrationInterface {
  TABLE_NAME = `${appId}_media_files`;
  COLUMN_NAME = 'size';
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE ${this.TABLE_NAME} ALTER COLUMN ${this.COLUMN_NAME} DROP NOT NULL`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE ${this.TABLE_NAME} ALTER COLUMN ${this.COLUMN_NAME} SET NOT NULL`);
  }
}
