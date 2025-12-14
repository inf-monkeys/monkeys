import { config } from '@/common/config';
import { MigrationInterface, QueryRunner, TableColumn } from 'typeorm';

const appId = config.server.appId;

export class OptimizeDataManagementIndexes1765729626052 implements MigrationInterface {
  name = 'OptimizeDataManagementIndexes1765729626052';

  // 禁用事务，因为 PostgreSQL 的 CREATE INDEX CONCURRENTLY 不能在事务中运行
  transaction = false;

  // data_views 表
  DATA_VIEWS_TABLE = `${appId}_data_views`;

  // data_assets 表
  DATA_ASSETS_TABLE = `${appId}_data_assets`;

  // 旧的索引名称（需要删除的）
  OLD_INDEXES_DATA_VIEWS = [
    `${appId}_idx_data_views_parent_id_is_deleted`,
    `${appId}_idx_data_views_team_id_is_public_is_deleted`,
    `${appId}_idx_data_views_is_deleted_created_timestamp`,
    `${appId}_idx_data_views_path`,
  ];

  OLD_INDEXES_DATA_ASSETS = [
    `${appId}_idx_data_assets_view_id_is_deleted_status`,
    `${appId}_idx_data_assets_team_id_is_deleted_status`,
    `${appId}_idx_data_assets_status_is_deleted_created_timestamp`,
    `${appId}_idx_data_assets_creator_user_id_is_deleted`,
  ];

  // 新的优化索引名称
  // data_views 索引（保持简洁）
  INDEX_DATA_VIEWS_PARENT = `${appId}_idx_dv_parent`;
  INDEX_DATA_VIEWS_TEAM = `${appId}_idx_dv_team`;
  INDEX_DATA_VIEWS_PATH = `${appId}_idx_dv_path`;

  // data_assets 索引（优化为部分索引）
  INDEX_DATA_ASSETS_VIEW = `${appId}_idx_da_view`;
  INDEX_DATA_ASSETS_TEAM = `${appId}_idx_da_team`;
  INDEX_DATA_ASSETS_CREATOR = `${appId}_idx_da_creator`;
  INDEX_DATA_ASSETS_SEARCH = `${appId}_idx_da_search_text`;

  /**
   * 安全删除索引（如果存在）
   */
  private async dropIndexIfExists(
    queryRunner: QueryRunner,
    _tableName: string,
    indexName: string,
  ): Promise<void> {
    const isPostgres = queryRunner.connection.options.type === 'postgres';

    try {
      if (isPostgres) {
        // PostgreSQL: 使用 CONCURRENTLY 避免锁表
        await queryRunner.query(`DROP INDEX CONCURRENTLY IF EXISTS "${indexName}"`);
        console.log(`✓ Dropped index ${indexName} (if existed)`);
      } else {
        // SQLite: 检查索引是否存在
        const result = await queryRunner.query(
          `SELECT name FROM sqlite_master WHERE type='index' AND name='${indexName}'`
        );
        if (result.length > 0) {
          await queryRunner.query(`DROP INDEX "${indexName}"`);
          console.log(`✓ Dropped index ${indexName}`);
        }
      }
    } catch (error) {
      console.warn(`Warning: Failed to drop index ${indexName}:`, error.message);
    }
  }

  /**
   * 为 PostgreSQL 创建并发索引，会自动清理失败的 INVALID 索引
   */
  private async createIndexConcurrently(
    queryRunner: QueryRunner,
    tableName: string,
    indexName: string,
    columns: string,
  ): Promise<void> {
    const isPostgres = queryRunner.connection.options.type === 'postgres';

    try {
      console.log(`Creating index ${indexName} on ${tableName}...`);

      if (isPostgres) {
        await queryRunner.query(`CREATE INDEX CONCURRENTLY "${indexName}" ON "${tableName}" ${columns}`);
      } else {
        // SQLite 不支持 CONCURRENTLY
        await queryRunner.query(`CREATE INDEX "${indexName}" ON "${tableName}" ${columns}`);
      }

      console.log(`✓ Index ${indexName} created successfully`);
    } catch (error) {
      // 如果索引已存在，忽略错误
      if (error.message?.includes('already exists')) {
        console.log(`Index ${indexName} already exists, skipping...`);
        return;
      }

      if (isPostgres) {
        // 检查是否有 INVALID 索引（创建失败留下的）
        console.error(`Failed to create index ${indexName}:`, error.message);
        console.log(`Checking for invalid index ${indexName}...`);

        const result = await queryRunner.query(
          `SELECT indexname, pg_index.indisvalid
           FROM pg_indexes
           JOIN pg_class ON pg_indexes.indexname = pg_class.relname
           JOIN pg_index ON pg_class.oid = pg_index.indexrelid
           WHERE indexname = $1`,
          [indexName],
        );

        if (result.length > 0 && !result[0].indisvalid) {
          console.log(`Found invalid index ${indexName}, dropping it...`);
          await queryRunner.query(`DROP INDEX CONCURRENTLY IF EXISTS "${indexName}"`);
          console.log(`Invalid index ${indexName} dropped. Please run migration again.`);
        }
      }

      throw error;
    }
  }

  /**
   * 添加列（如果不存在）
   */
  private async addColumnIfNotExists(
    queryRunner: QueryRunner,
    tableName: string,
    column: TableColumn,
  ): Promise<void> {
    const table = await queryRunner.getTable(tableName);
    const existingColumn = table?.findColumnByName(column.name);

    if (!existingColumn) {
      await queryRunner.addColumn(tableName, column);
      console.log(`✓ Added column ${column.name} to ${tableName}`);
    } else {
      console.log(`Column ${column.name} already exists in ${tableName}, skipping...`);
    }
  }

  public async up(queryRunner: QueryRunner): Promise<void> {
    const isPostgres = queryRunner.connection.options.type === 'postgres';

    console.log(`\n=== Optimizing data management indexes ===`);
    console.log(`Database type: ${queryRunner.connection.options.type}`);

    // ========== 第一步：删除旧索引 ==========
    console.log(`\n--- Step 1: Dropping old indexes ---`);

    for (const indexName of this.OLD_INDEXES_DATA_VIEWS) {
      await this.dropIndexIfExists(queryRunner, this.DATA_VIEWS_TABLE, indexName);
    }

    for (const indexName of this.OLD_INDEXES_DATA_ASSETS) {
      await this.dropIndexIfExists(queryRunner, this.DATA_ASSETS_TABLE, indexName);
    }

    // ========== 第二步：添加 searchable_text 字段 ==========
    console.log(`\n--- Step 2: Adding searchable_text column ---`);

    const dataAssetsTable = await queryRunner.getTable(this.DATA_ASSETS_TABLE);
    if (dataAssetsTable) {
      await this.addColumnIfNotExists(
        queryRunner,
        this.DATA_ASSETS_TABLE,
        new TableColumn({
          name: 'searchable_text',
          type: isPostgres ? 'text' : 'text',
          isNullable: true,
          comment: '可搜索文本（name + displayName + description 的组合，用于全文搜索）',
        }),
      );

      // 为现有数据生成 searchable_text
      console.log(`Populating searchable_text for existing records...`);
      if (isPostgres) {
        await queryRunner.query(`
          UPDATE "${this.DATA_ASSETS_TABLE}"
          SET searchable_text = LOWER(
            COALESCE(name, '') || ' ' ||
            COALESCE(display_name, '') || ' ' ||
            COALESCE(CAST(description AS TEXT), '')
          )
          WHERE searchable_text IS NULL AND is_deleted = false
        `);
      } else {
        await queryRunner.query(`
          UPDATE "${this.DATA_ASSETS_TABLE}"
          SET searchable_text = LOWER(
            COALESCE(name, '') || ' ' ||
            COALESCE(display_name, '') || ' ' ||
            COALESCE(description, '')
          )
          WHERE searchable_text IS NULL AND is_deleted = 0
        `);
      }
      console.log(`✓ Searchable text populated`);
    }

    // ========== 第三步：创建优化的索引 ==========
    console.log(`\n--- Step 3: Creating optimized indexes ---`);

    // data_views 索引（保持原有逻辑）
    const dataViewsTable = await queryRunner.getTable(this.DATA_VIEWS_TABLE);
    if (dataViewsTable) {
      console.log(`\nCreating indexes for ${this.DATA_VIEWS_TABLE}...`);

      // 父视图索引（部分索引：只为未删除的记录）
      const parentIdxDef = isPostgres
        ? '(parent_id, is_deleted) WHERE is_deleted = false'
        : '(parent_id, is_deleted)';
      await this.createIndexConcurrently(
        queryRunner,
        this.DATA_VIEWS_TABLE,
        this.INDEX_DATA_VIEWS_PARENT,
        parentIdxDef,
      );

      // 团队索引（部分索引：只为未删除的记录）
      const teamIdxDef = isPostgres
        ? '(team_id, is_public, created_timestamp DESC) WHERE is_deleted = false'
        : '(team_id, is_public, created_timestamp)';
      await this.createIndexConcurrently(
        queryRunner,
        this.DATA_VIEWS_TABLE,
        this.INDEX_DATA_VIEWS_TEAM,
        teamIdxDef,
      );

      // 路径索引
      await this.createIndexConcurrently(
        queryRunner,
        this.DATA_VIEWS_TABLE,
        this.INDEX_DATA_VIEWS_PATH,
        '(path)',
      );
    }

    // data_assets 索引（大幅优化）
    if (dataAssetsTable) {
      console.log(`\nCreating indexes for ${this.DATA_ASSETS_TABLE}...`);

      // 视图索引（部分索引：只为未删除的记录，覆盖所有状态）
      // 包含 status 字段，支持按视图+状态的组合查询
      const viewIdxDef = isPostgres
        ? '(view_id, status, created_timestamp DESC) WHERE is_deleted = false'
        : '(view_id, status, created_timestamp)';
      await this.createIndexConcurrently(
        queryRunner,
        this.DATA_ASSETS_TABLE,
        this.INDEX_DATA_ASSETS_VIEW,
        viewIdxDef,
      );

      // 团队索引（部分索引：只为未删除的记录）
      const teamIdxDef = isPostgres
        ? '(team_id, status, created_timestamp DESC) WHERE is_deleted = false'
        : '(team_id, status, created_timestamp)';
      await this.createIndexConcurrently(
        queryRunner,
        this.DATA_ASSETS_TABLE,
        this.INDEX_DATA_ASSETS_TEAM,
        teamIdxDef,
      );

      // 创建者索引（部分索引：只为未删除的记录）
      const creatorIdxDef = isPostgres
        ? '(creator_user_id, created_timestamp DESC) WHERE is_deleted = false'
        : '(creator_user_id, created_timestamp)';
      await this.createIndexConcurrently(
        queryRunner,
        this.DATA_ASSETS_TABLE,
        this.INDEX_DATA_ASSETS_CREATOR,
        creatorIdxDef,
      );

      // 全文搜索索引（PostgreSQL 使用 GIN，SQLite 使用普通索引）
      if (isPostgres) {
        console.log(`Creating GIN full-text search index...`);
        await this.createIndexConcurrently(
          queryRunner,
          this.DATA_ASSETS_TABLE,
          this.INDEX_DATA_ASSETS_SEARCH,
          `USING gin(to_tsvector('simple', COALESCE(searchable_text, '')))`,
        );
      } else {
        // SQLite 使用普通索引
        await this.createIndexConcurrently(
          queryRunner,
          this.DATA_ASSETS_TABLE,
          this.INDEX_DATA_ASSETS_SEARCH,
          '(searchable_text)',
        );
      }
    }

    console.log(`\n=== Index optimization completed successfully ===`);
    console.log(`\nOptimizations applied:`);
    console.log(`  ✓ Removed old redundant indexes`);
    console.log(`  ✓ Added searchable_text column for fast search`);
    console.log(`  ✓ Created partial indexes (smaller, faster)`);
    if (isPostgres) {
      console.log(`  ✓ Created GIN full-text search index`);
    }
    console.log(`\nNext steps:`);
    console.log(`  1. Update your application code to use searchable_text`);
    console.log(`  2. Ensure new records populate searchable_text on create/update`);
    console.log(``);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    console.log(`\n=== Rolling back index optimization ===`);

    // 删除新索引
    await this.dropIndexIfExists(queryRunner, this.DATA_ASSETS_TABLE, this.INDEX_DATA_ASSETS_SEARCH);
    await this.dropIndexIfExists(queryRunner, this.DATA_ASSETS_TABLE, this.INDEX_DATA_ASSETS_CREATOR);
    await this.dropIndexIfExists(queryRunner, this.DATA_ASSETS_TABLE, this.INDEX_DATA_ASSETS_TEAM);
    await this.dropIndexIfExists(queryRunner, this.DATA_ASSETS_TABLE, this.INDEX_DATA_ASSETS_VIEW);
    await this.dropIndexIfExists(queryRunner, this.DATA_VIEWS_TABLE, this.INDEX_DATA_VIEWS_PATH);
    await this.dropIndexIfExists(queryRunner, this.DATA_VIEWS_TABLE, this.INDEX_DATA_VIEWS_TEAM);
    await this.dropIndexIfExists(queryRunner, this.DATA_VIEWS_TABLE, this.INDEX_DATA_VIEWS_PARENT);

    // 删除 searchable_text 列
    const dataAssetsTable = await queryRunner.getTable(this.DATA_ASSETS_TABLE);
    if (dataAssetsTable) {
      const column = dataAssetsTable.findColumnByName('searchable_text');
      if (column) {
        await queryRunner.dropColumn(this.DATA_ASSETS_TABLE, 'searchable_text');
        console.log(`✓ Dropped searchable_text column`);
      }
    }

    console.log(`\n=== Rollback completed ===`);
  }
}
