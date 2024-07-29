import { config } from '@/common/config';
import { MigrationInterface, QueryRunner, Table } from 'typeorm';
import { ASSET_COMMON_COLUMNS } from './columns';

const appId = config.server.appId;
export class MigartionAddTableConversationApp1722223140728 implements MigrationInterface {
  tableName = `${appId}_conversation_apps`;
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.createTable(
      new Table({
        name: this.tableName,
        columns: [
          ...ASSET_COMMON_COLUMNS,
          {
            name: 'custom_model_name',
            type: 'varchar',
            length: '255',
            isNullable: true,
          },
          {
            name: 'model',
            type: 'varchar',
            length: '255',
          },
          {
            name: 'system_prompt',
            type: 'varchar',
            length: '255',
            isNullable: true,
          },
          {
            name: 'knowledge_base',
            type: 'varchar',
            length: '255',
            isNullable: true,
          },
          {
            name: 'sql_knowledge_base',
            type: 'varchar',
            length: '255',
            isNullable: true,
          },
          {
            name: 'tools',
            type: 'text',
            isNullable: true,
          },
          {
            name: 'temperature',
            type: 'float',
            isNullable: true,
            default: 0.7,
          },
          {
            name: 'presence_penalty',
            type: 'float',
            isNullable: true,
            default: 0.5,
          },
          {
            name: 'frequency_penalty',
            type: 'float',
            isNullable: true,
            default: 0.5,
          },
        ],
      }),
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropTable(this.tableName);
  }
}
