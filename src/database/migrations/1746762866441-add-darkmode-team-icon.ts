import { config } from '@/common/config';
import { MigrationInterface, QueryRunner, TableColumn } from 'typeorm';
const appId = config.server.appId;
export class AddDarkmodeTeamIcon1746762866441 implements MigrationInterface {
  TABLE_NAME = `${appId}_teams`;
  COLUMN_NAME = `darkmode_icon_url`;
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.addColumn(
      this.TABLE_NAME,
      new TableColumn({
        name: this.COLUMN_NAME,
        type: 'varchar',
        isNullable: true,
      }),
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropColumn(this.TABLE_NAME, this.COLUMN_NAME);
  }
}
