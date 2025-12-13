import { config } from '@/common/config';
import { MigrationInterface, QueryRunner } from 'typeorm';

const appId = config.server.appId;

export class AlterDataAssetsMediaThumbnailToText1734100000000 implements MigrationInterface {
  TABLE_NAME = `${appId}_data_assets`;

  public async up(queryRunner: QueryRunner): Promise<void> {
    // 将 media 和 thumbnail 字段从 varchar(500) 改为 text 类型（等同于 varchar(max)）
    await queryRunner.query(`ALTER TABLE ${this.TABLE_NAME} ALTER COLUMN media TYPE text`);
    await queryRunner.query(`ALTER TABLE ${this.TABLE_NAME} ALTER COLUMN thumbnail TYPE text`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // 回滚：将字段改回 varchar(500)
    await queryRunner.query(`ALTER TABLE ${this.TABLE_NAME} ALTER COLUMN media TYPE varchar(500)`);
    await queryRunner.query(`ALTER TABLE ${this.TABLE_NAME} ALTER COLUMN thumbnail TYPE varchar(500)`);
  }
}
