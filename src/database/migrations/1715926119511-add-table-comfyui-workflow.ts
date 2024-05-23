import { config } from '@/common/config';
import { MigrationInterface, QueryRunner, Table } from 'typeorm';
import { ASSET_COMMON_COLUMNS } from './columns';

const appId = config.server.appId;

export class MigartionAddTableComfyuiWorkflow1715926119511 implements MigrationInterface {
  tableName = `${appId}_comfyui_workflows`;
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.createTable(
      new Table({
        name: this.tableName,
        columns: [
          ...ASSET_COMMON_COLUMNS,
          {
            name: 'workflow_type',
            type: 'varchar',
            length: '255',
          },
          {
            name: 'originla_data',
            type: 'text',
            comment: 'Original Data',
          },
          {
            name: 'workflow',
            type: 'text',
            isNullable: true,
          },
          {
            name: 'prompt',
            type: 'text',
          },
          {
            name: 'tool_input',
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
