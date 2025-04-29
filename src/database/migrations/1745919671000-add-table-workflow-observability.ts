import { config } from '@/common/config';
import { MigrationInterface, QueryRunner, Table } from 'typeorm';
import { COMMON_COLUMNS } from './columns';

const appId = config.server.appId;

export class MigartionAddWorkflowObservability1745919671000 implements MigrationInterface {
  tableName = `${appId}_workflow_observability`;

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.createTable(
      new Table({
        name: this.tableName,
        columns: [
          ...COMMON_COLUMNS,
          {
            name: 'workflow_id',
            type: 'varchar',
            length: '255',
          },
          {
            name: 'team_id',
            type: 'varchar',
            length: '255',
          },
          {
            name: 'name',
            type: 'varchar',
            length: '255',
            isNullable: true,
          },
          {
            name: 'platform',
            type: 'varchar',
            length: '255',
          },
          {
            name: 'platform_config',
            type: 'simple-json',
          },
        ],
      }),
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropTable(this.tableName);
  }
}
