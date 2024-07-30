import { config } from '@/common/config';
import { MigrationInterface, QueryRunner, Table } from 'typeorm';
import { COMMON_COLUMNS } from './columns';

const appId = config.server.appId;

export class MigartionAddTableConversationExecutions1722324247892 implements MigrationInterface {
  tableName = `${appId}_conversation_executions`;

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.createTable(
      new Table({
        name: this.tableName,
        columns: [
          ...COMMON_COLUMNS,
          {
            name: 'app_id',
            type: 'varchar',
            length: '255',
          },
          {
            name: 'user_id',
            type: 'varchar',
            length: '255',
          },
          {
            name: 'status',
            type: 'varchar',
            length: '255',
            isNullable: true,
          },
          {
            name: 'takes',
            type: 'int',
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
