import { config } from '@/common/config';
import { MigrationInterface, QueryRunner, Table } from 'typeorm';
import { COMMON_COLUMNS } from './columns';

const appId = config.server.appId;
export class MigartionAddTableOneapiUser1719200817122 implements MigrationInterface {
  TABLE_NAME = `${appId}_oneapi_users`;
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.createTable(
      new Table({
        name: this.TABLE_NAME,
        columns: [
          ...COMMON_COLUMNS,
          {
            name: 'team_id',
            type: 'varchar',
            length: '1024',
          },
          {
            name: 'user_id',
            type: 'integer',
          },
          {
            name: 'user_token',
            type: 'varchar',
            length: '1024',
            isNullable: true,
          },
          {
            name: 'api_key',
            type: 'varchar',
            length: '1024',
            isNullable: true,
          },
          {
            name: 'username',
            type: 'varchar',
            length: '1024',
            isNullable: true,
          },
          {
            name: 'password',
            type: 'varchar',
            length: '1024',
            isNullable: true,
          },
        ],
      }),
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropTable(this.TABLE_NAME);
  }
}
