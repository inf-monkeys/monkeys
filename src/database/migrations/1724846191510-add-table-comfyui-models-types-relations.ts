import { config } from '@/common/config';
import { MigrationInterface, QueryRunner, Table } from 'typeorm';
import { ASSET_COMMON_COLUMNS, COMMON_COLUMNS } from './columns';

const appId = config.server.appId;

export class MigartionAddComfyuiModel1724846191510 implements MigrationInterface {
  table1Name = `${appId}_comfyui_model`;
  table2Name = `${appId}_comfyui_model_type`;
  table3Name = `${appId}_comfyui_model_server_relations`;

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.createTable(
      new Table({
        name: this.table1Name,
        columns: [
          ...ASSET_COMMON_COLUMNS,
          {
            name: 'sha256',
            type: 'varchar',
            length: '255',
          },
        ],
      }),
    );
    await queryRunner.createTable(
      new Table({
        name: this.table2Name,
        columns: [
          ...ASSET_COMMON_COLUMNS,
          {
            name: 'name',
            type: 'varchar',
            length: '255',
          },
          {
            name: 'path',
            type: 'varchar',
            length: '255',
          },
        ],
      }),
    );
    await queryRunner.createTable(
      new Table({
        name: this.table3Name,
        columns: [
          ...COMMON_COLUMNS,
          {
            name: 'team_id',
            type: 'varchar',
            length: '255',
          },
          {
            name: 'path',
            type: 'varchar',
            length: '255',
          },
          {
            name: 'filename',
            type: 'varchar',
            length: '255',
          },
          {
            name: 'modelId',
            type: 'varchar',
            length: '128',
            isNullable: true,
          },
          {
            name: 'serverId',
            type: 'varchar',
            length: '128',
            isNullable: true,
          },
        ],
        foreignKeys: [
          {
            columnNames: ['modelId'],
            referencedTableName: 'monkeys_comfyui_model',
            referencedColumnNames: ['id'],
            onDelete: 'NO ACTION',
            onUpdate: 'NO ACTION',
          },
          {
            columnNames: ['serverId'],
            referencedTableName: 'monkeys_comfyui_servers',
            referencedColumnNames: ['id'],
            onDelete: 'NO ACTION',
            onUpdate: 'NO ACTION',
          },
        ],
      }),
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropTable(this.table1Name);
    await queryRunner.dropTable(this.table2Name);
    await queryRunner.dropTable(this.table3Name);
  }
}
