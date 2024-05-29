import { config } from '@/common/config';
import { MigrationInterface, QueryRunner, Table } from 'typeorm';
import { COMMON_COLUMNS } from './columns';

const appId = config.server.appId;

export class MigartionAddTableComfyuiServers1716975090536 implements MigrationInterface {
  tableName = `${appId}_comfyui_servers`;

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.createTable(
      new Table({
        name: this.tableName,
        columns: [
          ...COMMON_COLUMNS,
          {
            name: 'creator_user_id',
            type: 'varchar',
            length: '255',
            isNullable: true,
          },
          {
            name: 'team_id',
            type: 'varchar',
            isNullable: true,
          },
          {
            name: 'address',
            type: 'varchar',
            length: '1024',
          },
          {
            name: 'status',
            type: 'varchar',
            length: '64',
          },
          {
            name: 'description',
            type: 'varchar',
            length: '1024',
          },
          {
            name: 'is_default',
            type: 'boolean',
            default: false,
          },
        ],
      }),
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropTable(this.tableName);
  }
}
