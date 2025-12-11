import { config } from '@/common/config';
import { MigrationInterface, QueryRunner, Table, TableIndex, TableForeignKey } from 'typeorm';

const appId = config.server.appId;

export class CreateDataManagementTables1733900000000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    // 1. 创建 data_views 表（视图/分类表）
    await queryRunner.createTable(
      new Table({
        name: `${appId}_data_views`,
        columns: [
          {
            name: 'id',
            type: 'varchar',
            length: '128',
            isPrimary: true,
          },
          {
            name: 'name',
            type: 'varchar',
            length: '255',
            isNullable: false,
          },
          {
            name: 'description',
            type: 'text',
            isNullable: true,
          },
          {
            name: 'icon_url',
            type: 'varchar',
            length: '500',
            isNullable: true,
          },
          {
            name: 'parent_id',
            type: 'varchar',
            length: '128',
            isNullable: true,
          },
          {
            name: 'path',
            type: 'varchar',
            length: '1000',
            isNullable: false,
          },
          {
            name: 'level',
            type: 'int',
            default: 0,
          },
          {
            name: 'sort',
            type: 'int',
            default: 0,
          },
          {
            name: 'filter_config',
            type: 'json',
            isNullable: true,
          },
          {
            name: 'display_config',
            type: 'json',
            isNullable: true,
          },
          {
            name: 'creator_user_id',
            type: 'varchar',
            length: '128',
            isNullable: false,
          },
          {
            name: 'team_id',
            type: 'varchar',
            length: '128',
            isNullable: true,
          },
          {
            name: 'is_public',
            type: 'boolean',
            default: false,
          },
          {
            name: 'asset_count',
            type: 'int',
            default: 0,
          },
          {
            name: 'created_timestamp',
            type: 'bigint',
            isNullable: false,
          },
          {
            name: 'updated_timestamp',
            type: 'bigint',
            isNullable: false,
          },
          {
            name: 'is_deleted',
            type: 'boolean',
            default: false,
          },
        ],
      }),
      true
    );

    // 2. 创建 data_assets 表（数据资产表）
    await queryRunner.createTable(
      new Table({
        name: `${appId}_data_assets`,
        columns: [
          {
            name: 'id',
            type: 'varchar',
            length: '128',
            isPrimary: true,
          },
          {
            name: 'name',
            type: 'varchar',
            length: '500',
            isNullable: false,
          },
          {
            name: 'view_id',
            type: 'varchar',
            length: '128',
            isNullable: false,
          },
          {
            name: 'asset_type',
            type: 'varchar',
            length: '50',
            isNullable: false,
          },
          {
            name: 'primary_content',
            type: 'json',
            isNullable: false,
          },
          {
            name: 'properties',
            type: 'json',
            isNullable: true,
          },
          {
            name: 'files',
            type: 'json',
            isNullable: true,
          },
          {
            name: 'view_count',
            type: 'int',
            default: 0,
          },
          {
            name: 'download_count',
            type: 'int',
            default: 0,
          },
          {
            name: 'status',
            type: 'varchar',
            length: '20',
            default: "'draft'",
          },
          {
            name: 'published_at',
            type: 'bigint',
            isNullable: true,
          },
          {
            name: 'team_id',
            type: 'varchar',
            length: '128',
            isNullable: true,
          },
          {
            name: 'creator_user_id',
            type: 'varchar',
            length: '128',
            isNullable: false,
          },
          {
            name: 'icon_url',
            type: 'varchar',
            length: '500',
            isNullable: true,
          },
          {
            name: 'display_name',
            type: 'varchar',
            isNullable: false,
          },
          {
            name: 'description',
            type: 'varchar',
            isNullable: true,
          },
          {
            name: 'is_preset',
            type: 'boolean',
            default: false,
          },
          {
            name: 'is_published',
            type: 'boolean',
            default: false,
          },
          {
            name: 'publish_config',
            type: 'json',
            isNullable: true,
          },
          {
            name: 'prefer_app_id',
            type: 'varchar',
            isNullable: true,
          },
          {
            name: 'sort',
            type: 'int',
            default: 0,
          },
          {
            name: 'created_timestamp',
            type: 'bigint',
            isNullable: false,
          },
          {
            name: 'updated_timestamp',
            type: 'bigint',
            isNullable: false,
          },
          {
            name: 'is_deleted',
            type: 'boolean',
            default: false,
          },
        ],
      }),
      true
    );

    // 3. 创建 data_view_permissions 表（视图权限表）
    await queryRunner.createTable(
      new Table({
        name: `${appId}_data_view_permissions`,
        columns: [
          {
            name: 'id',
            type: 'varchar',
            length: '128',
            isPrimary: true,
          },
          {
            name: 'view_id',
            type: 'varchar',
            length: '128',
            isNullable: false,
          },
          {
            name: 'user_id',
            type: 'varchar',
            length: '128',
            isNullable: true,
          },
          {
            name: 'role_id',
            type: 'varchar',
            length: '128',
            isNullable: true,
          },
          {
            name: 'permission',
            type: 'varchar',
            length: '20',
            isNullable: false,
          },
          {
            name: 'created_timestamp',
            type: 'bigint',
            isNullable: false,
          },
          {
            name: 'updated_timestamp',
            type: 'bigint',
            isNullable: false,
          },
          {
            name: 'is_deleted',
            type: 'boolean',
            default: false,
          },
        ],
      }),
      true
    );

    // 4. 创建 data_asset_permissions 表（资产权限表）
    await queryRunner.createTable(
      new Table({
        name: `${appId}_data_asset_permissions`,
        columns: [
          {
            name: 'id',
            type: 'varchar',
            length: '128',
            isPrimary: true,
          },
          {
            name: 'asset_id',
            type: 'varchar',
            length: '128',
            isNullable: false,
          },
          {
            name: 'user_id',
            type: 'varchar',
            length: '128',
            isNullable: true,
          },
          {
            name: 'role_id',
            type: 'varchar',
            length: '128',
            isNullable: true,
          },
          {
            name: 'permission',
            type: 'varchar',
            length: '20',
            isNullable: false,
          },
          {
            name: 'created_timestamp',
            type: 'bigint',
            isNullable: false,
          },
          {
            name: 'updated_timestamp',
            type: 'bigint',
            isNullable: false,
          },
          {
            name: 'is_deleted',
            type: 'boolean',
            default: false,
          },
        ],
      }),
      true
    );

    // 5. 创建索引

    // data_views 索引
    await queryRunner.createIndex(
      `${appId}_data_views`,
      new TableIndex({
        name: `IDX_${appId}_DATA_VIEWS_PARENT_ID`,
        columnNames: ['parent_id'],
      })
    );

    await queryRunner.createIndex(
      `${appId}_data_views`,
      new TableIndex({
        name: `IDX_${appId}_DATA_VIEWS_PATH`,
        columnNames: ['path'],
      })
    );

    await queryRunner.createIndex(
      `${appId}_data_views`,
      new TableIndex({
        name: `IDX_${appId}_DATA_VIEWS_TEAM_ID`,
        columnNames: ['team_id'],
      })
    );

    await queryRunner.createIndex(
      `${appId}_data_views`,
      new TableIndex({
        name: `IDX_${appId}_DATA_VIEWS_CREATOR_USER_ID`,
        columnNames: ['creator_user_id'],
      })
    );

    await queryRunner.createIndex(
      `${appId}_data_views`,
      new TableIndex({
        name: `IDX_${appId}_DATA_VIEWS_IS_DELETED`,
        columnNames: ['is_deleted'],
      })
    );

    // data_assets 索引
    await queryRunner.createIndex(
      `${appId}_data_assets`,
      new TableIndex({
        name: `IDX_${appId}_DATA_ASSETS_VIEW_ID`,
        columnNames: ['view_id'],
      })
    );

    await queryRunner.createIndex(
      `${appId}_data_assets`,
      new TableIndex({
        name: `IDX_${appId}_DATA_ASSETS_ASSET_TYPE`,
        columnNames: ['asset_type'],
      })
    );

    await queryRunner.createIndex(
      `${appId}_data_assets`,
      new TableIndex({
        name: `IDX_${appId}_DATA_ASSETS_TEAM_ID`,
        columnNames: ['team_id'],
      })
    );

    await queryRunner.createIndex(
      `${appId}_data_assets`,
      new TableIndex({
        name: `IDX_${appId}_DATA_ASSETS_CREATOR_USER_ID`,
        columnNames: ['creator_user_id'],
      })
    );

    await queryRunner.createIndex(
      `${appId}_data_assets`,
      new TableIndex({
        name: `IDX_${appId}_DATA_ASSETS_STATUS`,
        columnNames: ['status'],
      })
    );

    await queryRunner.createIndex(
      `${appId}_data_assets`,
      new TableIndex({
        name: `IDX_${appId}_DATA_ASSETS_IS_DELETED`,
        columnNames: ['is_deleted'],
      })
    );

    // 权限表索引
    await queryRunner.createIndex(
      `${appId}_data_view_permissions`,
      new TableIndex({
        name: `IDX_${appId}_DATA_VIEW_PERMISSIONS_VIEW_ID`,
        columnNames: ['view_id'],
      })
    );

    await queryRunner.createIndex(
      `${appId}_data_asset_permissions`,
      new TableIndex({
        name: `IDX_${appId}_DATA_ASSET_PERMISSIONS_ASSET_ID`,
        columnNames: ['asset_id'],
      })
    );

    // 6. 创建外键（可选，根据需要）
    await queryRunner.createForeignKey(
      `${appId}_data_assets`,
      new TableForeignKey({
        columnNames: ['view_id'],
        referencedTableName: `${appId}_data_views`,
        referencedColumnNames: ['id'],
        onDelete: 'CASCADE',
      })
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // 删除外键
    const dataAssetsTable = await queryRunner.getTable(`${appId}_data_assets`);
    if (dataAssetsTable) {
      const foreignKeys = dataAssetsTable.foreignKeys;
      for (const fk of foreignKeys) {
        await queryRunner.dropForeignKey(`${appId}_data_assets`, fk);
      }
    }

    // 删除表
    await queryRunner.dropTable(`${appId}_data_asset_permissions`, true);
    await queryRunner.dropTable(`${appId}_data_view_permissions`, true);
    await queryRunner.dropTable(`${appId}_data_assets`, true);
    await queryRunner.dropTable(`${appId}_data_views`, true);
  }
}
