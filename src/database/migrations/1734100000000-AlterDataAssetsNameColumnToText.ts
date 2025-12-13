import { config } from '@/common/config';
import { MigrationInterface, QueryRunner, TableColumn } from 'typeorm';

const appId = config.server.appId;

export class AlterDataAssetsNameColumnToText1734100000000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    // Change name column from varchar(500) to text
    await queryRunner.changeColumn(
      `${appId}_data_assets`,
      'name',
      new TableColumn({
        name: 'name',
        type: 'text',
        isNullable: false,
      })
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Revert name column back to varchar(500)
    await queryRunner.changeColumn(
      `${appId}_data_assets`,
      'name',
      new TableColumn({
        name: 'name',
        type: 'varchar',
        length: '500',
        isNullable: false,
      })
    );
  }
}
