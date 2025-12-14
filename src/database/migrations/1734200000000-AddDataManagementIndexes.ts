import { config } from '@/common/config';
import { MigrationInterface, QueryRunner, TableIndex } from 'typeorm';
import { isIndexExist } from './utils';

const appId = config.server.appId;

export class AddDataManagementIndexes1734200000000 implements MigrationInterface {
  name = 'AddDataManagementIndexes1734200000000';

  // 禁用事务，因为 PostgreSQL 的 CREATE INDEX CONCURRENTLY 不能在事务中运行
  transaction = false;

  // data_views 表索引
  DATA_VIEWS_TABLE = `${appId}_data_views`;
  INDEX_DATA_VIEWS_PARENT_ID = `${appId}_idx_data_views_parent_id_is_deleted`;
  INDEX_DATA_VIEWS_TEAM_ID = `${appId}_idx_data_views_team_id_is_public_is_deleted`;
  INDEX_DATA_VIEWS_CREATED = `${appId}_idx_data_views_is_deleted_created_timestamp`;
  INDEX_DATA_VIEWS_PATH = `${appId}_idx_data_views_path`;

  // data_assets 表索引
  DATA_ASSETS_TABLE = `${appId}_data_assets`;
  INDEX_DATA_ASSETS_VIEW_ID = `${appId}_idx_data_assets_view_id_is_deleted_status`;
  INDEX_DATA_ASSETS_TEAM_ID = `${appId}_idx_data_assets_team_id_is_deleted_status`;
  INDEX_DATA_ASSETS_STATUS = `${appId}_idx_data_assets_status_is_deleted_created_timestamp`;
  INDEX_DATA_ASSETS_CREATOR = `${appId}_idx_data_assets_creator_user_id_is_deleted`;

  public async up(queryRunner: QueryRunner): Promise<void> {
    // 检查是否是 PostgreSQL，如果是则使用 CONCURRENTLY 避免锁表
    const isPostgres = queryRunner.connection.options.type === 'postgres';

    // data_views 表索引
    const dataViewsTable = await queryRunner.getTable(this.DATA_VIEWS_TABLE);
    if (dataViewsTable) {
      if (!(await isIndexExist(this.INDEX_DATA_VIEWS_PARENT_ID, this.DATA_VIEWS_TABLE, queryRunner))) {
        if (isPostgres) {
          await queryRunner.query(
            `CREATE INDEX CONCURRENTLY "${this.INDEX_DATA_VIEWS_PARENT_ID}" ON "${this.DATA_VIEWS_TABLE}" ("parent_id", "is_deleted")`,
          );
        } else {
          await queryRunner.createIndex(
            dataViewsTable,
            new TableIndex({
              name: this.INDEX_DATA_VIEWS_PARENT_ID,
              columnNames: ['parent_id', 'is_deleted'],
              isUnique: false,
            }),
          );
        }
      }

      if (!(await isIndexExist(this.INDEX_DATA_VIEWS_TEAM_ID, this.DATA_VIEWS_TABLE, queryRunner))) {
        if (isPostgres) {
          await queryRunner.query(
            `CREATE INDEX CONCURRENTLY "${this.INDEX_DATA_VIEWS_TEAM_ID}" ON "${this.DATA_VIEWS_TABLE}" ("team_id", "is_public", "is_deleted")`,
          );
        } else {
          await queryRunner.createIndex(
            dataViewsTable,
            new TableIndex({
              name: this.INDEX_DATA_VIEWS_TEAM_ID,
              columnNames: ['team_id', 'is_public', 'is_deleted'],
              isUnique: false,
            }),
          );
        }
      }

      if (!(await isIndexExist(this.INDEX_DATA_VIEWS_CREATED, this.DATA_VIEWS_TABLE, queryRunner))) {
        if (isPostgres) {
          await queryRunner.query(
            `CREATE INDEX CONCURRENTLY "${this.INDEX_DATA_VIEWS_CREATED}" ON "${this.DATA_VIEWS_TABLE}" ("is_deleted", "created_timestamp")`,
          );
        } else {
          await queryRunner.createIndex(
            dataViewsTable,
            new TableIndex({
              name: this.INDEX_DATA_VIEWS_CREATED,
              columnNames: ['is_deleted', 'created_timestamp'],
              isUnique: false,
            }),
          );
        }
      }

      if (!(await isIndexExist(this.INDEX_DATA_VIEWS_PATH, this.DATA_VIEWS_TABLE, queryRunner))) {
        if (isPostgres) {
          await queryRunner.query(
            `CREATE INDEX CONCURRENTLY "${this.INDEX_DATA_VIEWS_PATH}" ON "${this.DATA_VIEWS_TABLE}" ("path")`,
          );
        } else {
          await queryRunner.createIndex(
            dataViewsTable,
            new TableIndex({
              name: this.INDEX_DATA_VIEWS_PATH,
              columnNames: ['path'],
              isUnique: false,
            }),
          );
        }
      }
    }

    // data_assets 表索引
    const dataAssetsTable = await queryRunner.getTable(this.DATA_ASSETS_TABLE);
    if (dataAssetsTable) {
      if (!(await isIndexExist(this.INDEX_DATA_ASSETS_VIEW_ID, this.DATA_ASSETS_TABLE, queryRunner))) {
        if (isPostgres) {
          await queryRunner.query(
            `CREATE INDEX CONCURRENTLY "${this.INDEX_DATA_ASSETS_VIEW_ID}" ON "${this.DATA_ASSETS_TABLE}" ("view_id", "is_deleted", "status")`,
          );
        } else {
          await queryRunner.createIndex(
            dataAssetsTable,
            new TableIndex({
              name: this.INDEX_DATA_ASSETS_VIEW_ID,
              columnNames: ['view_id', 'is_deleted', 'status'],
              isUnique: false,
            }),
          );
        }
      }

      if (!(await isIndexExist(this.INDEX_DATA_ASSETS_TEAM_ID, this.DATA_ASSETS_TABLE, queryRunner))) {
        if (isPostgres) {
          await queryRunner.query(
            `CREATE INDEX CONCURRENTLY "${this.INDEX_DATA_ASSETS_TEAM_ID}" ON "${this.DATA_ASSETS_TABLE}" ("team_id", "is_deleted", "status")`,
          );
        } else {
          await queryRunner.createIndex(
            dataAssetsTable,
            new TableIndex({
              name: this.INDEX_DATA_ASSETS_TEAM_ID,
              columnNames: ['team_id', 'is_deleted', 'status'],
              isUnique: false,
            }),
          );
        }
      }

      if (!(await isIndexExist(this.INDEX_DATA_ASSETS_STATUS, this.DATA_ASSETS_TABLE, queryRunner))) {
        if (isPostgres) {
          await queryRunner.query(
            `CREATE INDEX CONCURRENTLY "${this.INDEX_DATA_ASSETS_STATUS}" ON "${this.DATA_ASSETS_TABLE}" ("status", "is_deleted", "created_timestamp")`,
          );
        } else {
          await queryRunner.createIndex(
            dataAssetsTable,
            new TableIndex({
              name: this.INDEX_DATA_ASSETS_STATUS,
              columnNames: ['status', 'is_deleted', 'created_timestamp'],
              isUnique: false,
            }),
          );
        }
      }

      if (!(await isIndexExist(this.INDEX_DATA_ASSETS_CREATOR, this.DATA_ASSETS_TABLE, queryRunner))) {
        if (isPostgres) {
          await queryRunner.query(
            `CREATE INDEX CONCURRENTLY "${this.INDEX_DATA_ASSETS_CREATOR}" ON "${this.DATA_ASSETS_TABLE}" ("creator_user_id", "is_deleted")`,
          );
        } else {
          await queryRunner.createIndex(
            dataAssetsTable,
            new TableIndex({
              name: this.INDEX_DATA_ASSETS_CREATOR,
              columnNames: ['creator_user_id', 'is_deleted'],
              isUnique: false,
            }),
          );
        }
      }
    }
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // data_assets 表索引
    await queryRunner.dropIndex(this.DATA_ASSETS_TABLE, this.INDEX_DATA_ASSETS_CREATOR);
    await queryRunner.dropIndex(this.DATA_ASSETS_TABLE, this.INDEX_DATA_ASSETS_STATUS);
    await queryRunner.dropIndex(this.DATA_ASSETS_TABLE, this.INDEX_DATA_ASSETS_TEAM_ID);
    await queryRunner.dropIndex(this.DATA_ASSETS_TABLE, this.INDEX_DATA_ASSETS_VIEW_ID);

    // data_views 表索引
    await queryRunner.dropIndex(this.DATA_VIEWS_TABLE, this.INDEX_DATA_VIEWS_PATH);
    await queryRunner.dropIndex(this.DATA_VIEWS_TABLE, this.INDEX_DATA_VIEWS_CREATED);
    await queryRunner.dropIndex(this.DATA_VIEWS_TABLE, this.INDEX_DATA_VIEWS_TEAM_ID);
    await queryRunner.dropIndex(this.DATA_VIEWS_TABLE, this.INDEX_DATA_VIEWS_PARENT_ID);
  }
}
