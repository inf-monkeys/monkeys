import { config } from '@/common/config';
import { MigrationInterface, QueryRunner, Table } from 'typeorm';
import { COMMON_COLUMNS } from './columns';

const appId = config.server.appId;

export class MigartionAddTableTeamInvites1716972169705 implements MigrationInterface {
  tableName = `${appId}_team_invites`;

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.createTable(
      new Table({
        name: this.tableName,
        columns: [
          ...COMMON_COLUMNS,
          {
            name: 'inviter_user_id',
            type: 'varchar',
            length: '255',
            isNullable: true,
          },
          {
            name: 'target_user_id',
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
            name: 'type',
            type: 'int',
          },
          {
            name: 'outdate_timestamp',
            type: 'bigint',
          },
          {
            name: 'status',
            type: 'int',
          },
          {
            name: 'accepted_user_ids',
            type: 'text',
          },
          {
            name: 'remark',
            type: 'text',
            isNullable: true,
          },
        ],
      }),
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropTable(this.tableName);
  }
}
