import { config } from '@/common/config';
import { MigrationInterface, QueryRunner } from 'typeorm';

const appId = config.server.appId;

export class AlterDataAssetsNameColumnToText1765638315000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    // Change name column from varchar(500) to text
    await queryRunner.query(
      `ALTER TABLE ${appId}_data_assets ALTER COLUMN name TYPE text`
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Revert name column back to varchar(500)
    await queryRunner.query(
      `ALTER TABLE ${appId}_data_assets ALTER COLUMN name TYPE varchar(500)`
    );
  }
}
