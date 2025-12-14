import { AssetStatus, DataAssetEntity, DataAssetType } from '@/database/entities/data-management/data-asset.entity';
import { Injectable } from '@nestjs/common';
import { nanoid } from 'nanoid';
import { DataSource, In, Repository } from 'typeorm';

export interface DataAssetFilter {
  viewId?: string;
  assetType?: DataAssetType;
  status?: AssetStatus;
  creatorUserId?: string;
  teamId?: string;
  keyword?: string;
}

export interface DataAssetPagination {
  page: number;
  pageSize: number;
}

@Injectable()
export class DataAssetRepository extends Repository<DataAssetEntity> {
  constructor(private dataSource: DataSource) {
    super(DataAssetEntity, dataSource.createEntityManager());
  }

  /**
   * 根据 ID 查找资产
   */
  async findById(id: string): Promise<DataAssetEntity | null> {
    return this.findOne({
      where: { id, isDeleted: false },
    });
  }

  /**
   * 根据视图 ID 查找资产列表
   */
  async findByViewId(viewId: string, pagination?: DataAssetPagination): Promise<[DataAssetEntity[], number]> {
    const query = this.createQueryBuilder('asset')
      .where('asset.viewId = :viewId', { viewId })
      .andWhere('asset.isDeleted = :isDeleted', { isDeleted: false })
      .orderBy('asset.createdTimestamp', 'DESC');

    if (pagination) {
      const { page, pageSize } = pagination;
      query.skip((page - 1) * pageSize).take(pageSize);
    }

    return query.getManyAndCount();
  }

  /**
   * 生成可搜索文本
   */
  private generateSearchableText(data: {
    name: string;
    displayName: string | any;
    description?: string | any;
  }): string {
    // 处理 displayName（可能是 string 或 I18nValue）
    const displayNameStr = typeof data.displayName === 'string'
      ? data.displayName
      : data.displayName?.en || JSON.stringify(data.displayName || '');

    // 处理 description（可能是 string 或 I18nValue）
    const descriptionStr = typeof data.description === 'string'
      ? data.description
      : data.description?.en || JSON.stringify(data.description || '');

    const parts = [
      data.name,
      displayNameStr,
      descriptionStr
    ];

    return parts
      .filter(Boolean)
      .join(' ')
      .toLowerCase()
      .trim();
  }

  /**
   * 创建资产
   */
  async createAsset(data: {
    name: string;
    viewId: string;
    assetType: DataAssetType;
    primaryContent: any;
    properties?: any;
    files?: any[];
    media?: string;
    thumbnail?: string;
    teamId?: string;
    creatorUserId: string;
    displayName: string;
    description?: string;
    status?: AssetStatus;
  }): Promise<DataAssetEntity> {
    const now = Date.now();

    const asset = this.create({
      id: nanoid(),
      name: data.name,
      viewId: data.viewId,
      assetType: data.assetType,
      primaryContent: data.primaryContent,
      properties: data.properties,
      files: data.files,
      media: data.media,
      thumbnail: data.thumbnail,
      teamId: data.teamId,
      creatorUserId: data.creatorUserId,
      displayName: data.displayName,
      description: data.description,
      status: data.status || AssetStatus.DRAFT,
      viewCount: 0,
      downloadCount: 0,
      searchableText: this.generateSearchableText({
        name: data.name,
        displayName: data.displayName,
        description: data.description,
      }),
      createdTimestamp: now,
      updatedTimestamp: now,
      isDeleted: false,
    });

    return this.save(asset);
  }

  /**
   * 更新资产
   */
  async updateAsset(
    id: string,
    updates: {
      name?: string;
      displayName?: string;
      description?: string;
      primaryContent?: any;
      properties?: any;
      files?: any[];
      media?: string;
      thumbnail?: string;
      status?: AssetStatus;
    }
  ): Promise<void> {
    // 如果更新了影响搜索的字段，重新生成 searchableText
    let searchableText: string | undefined;
    if (updates.name || updates.displayName || updates.description !== undefined) {
      // 获取当前资产数据
      const current = await this.findById(id);
      if (current) {
        searchableText = this.generateSearchableText({
          name: updates.name ?? current.name,
          displayName: updates.displayName ?? current.displayName,
          description: updates.description ?? current.description,
        });
      }
    }

    await this.update(
      { id, isDeleted: false },
      {
        ...updates,
        ...(searchableText !== undefined && { searchableText }),
        updatedTimestamp: Date.now(),
      }
    );
  }

  /**
   * 移动资产到另一个视图
   */
  async moveToView(assetId: string, newViewId: string): Promise<void> {
    await this.update(
      { id: assetId, isDeleted: false },
      {
        viewId: newViewId,
        updatedTimestamp: Date.now(),
      }
    );
  }

  /**
   * 软删除资产
   */
  async softDeleteAsset(id: string): Promise<void> {
    await this.update(
      { id, isDeleted: false },
      {
        isDeleted: true,
        updatedTimestamp: Date.now(),
      }
    );
  }

  /**
   * 批量软删除资产
   */
  async batchSoftDelete(ids: string[]): Promise<void> {
    await this.update(
      { id: In(ids), isDeleted: false },
      {
        isDeleted: true,
        updatedTimestamp: Date.now(),
      }
    );
  }

  /**
   * 发布资产
   */
  async publishAsset(id: string): Promise<void> {
    await this.update(
      { id, isDeleted: false },
      {
        status: AssetStatus.PUBLISHED,
        isPublished: true,
        updatedTimestamp: Date.now(),
      }
    );
  }

  /**
   * 增加浏览计数
   */
  async incrementViewCount(id: string): Promise<void> {
    await this.increment({ id, isDeleted: false }, 'viewCount', 1);
  }

  /**
   * 增加下载计数
   */
  async incrementDownloadCount(id: string): Promise<void> {
    await this.increment({ id, isDeleted: false }, 'downloadCount', 1);
  }

  /**
   * 多条件筛选资产
   */
  async findByFilter(
    filter: DataAssetFilter,
    pagination?: DataAssetPagination
  ): Promise<[DataAssetEntity[], number]> {
    const query = this.createQueryBuilder('asset')
      .where('asset.isDeleted = :isDeleted', { isDeleted: false });

    if (filter.viewId) {
      query.andWhere('asset.viewId = :viewId', { viewId: filter.viewId });
    }

    if (filter.assetType) {
      query.andWhere('asset.assetType = :assetType', { assetType: filter.assetType });
    }

    if (filter.status) {
      query.andWhere('asset.status = :status', { status: filter.status });
    }

    if (filter.creatorUserId) {
      query.andWhere('asset.creatorUserId = :creatorUserId', { creatorUserId: filter.creatorUserId });
    }

    // 如果指定了 teamId，返回该团队的资产 + 全局资产（team_id = '0'）
    // 这样可以让所有团队看到公开的全局资产
    if (filter.teamId) {
      query.andWhere('(asset.teamId = :teamId OR asset.teamId = :globalTeamId)', {
        teamId: filter.teamId,
        globalTeamId: '0'
      });
    }

    if (filter.keyword) {
      // 使用优化的 searchable_text 字段进行搜索
      // PostgreSQL 使用全文搜索，SQLite 使用 LIKE（但只搜索一个字段，比之前快）
      const isPostgres = this.manager.connection.options.type === 'postgres';

      if (isPostgres) {
        // PostgreSQL: 使用全文搜索索引 (GIN)
        query.andWhere(
          `to_tsvector('simple', COALESCE(asset.searchableText, '')) @@ plainto_tsquery('simple', :keyword)`,
          { keyword: filter.keyword }
        );
      } else {
        // SQLite: 使用优化的单字段搜索
        query.andWhere(
          'LOWER(asset.searchableText) LIKE LOWER(:keyword)',
          { keyword: `%${filter.keyword}%` }
        );
      }
    }

    query.orderBy('asset.createdTimestamp', 'DESC');

    if (pagination) {
      const { page, pageSize } = pagination;
      query.skip((page - 1) * pageSize).take(pageSize);
    }

    return query.getManyAndCount();
  }

  /**
   * 检查用户是否是资产的创建者
   */
  async isCreator(assetId: string, userId: string): Promise<boolean> {
    const asset = await this.findOne({
      where: { id: assetId, creatorUserId: userId, isDeleted: false },
    });
    return !!asset;
  }

  /**
   * 统计视图中的资产数量
   */
  async countByViewId(viewId: string): Promise<number> {
    return this.count({
      where: { viewId, isDeleted: false },
    });
  }

  /**
   * 根据多个视图 ID 统计资产数量
   */
  async countByViewIds(viewIds: string[]): Promise<Map<string, number>> {
    const results = await this.createQueryBuilder('asset')
      .select('asset.viewId', 'viewId')
      .addSelect('COUNT(*)', 'count')
      .where('asset.viewId IN (:...viewIds)', { viewIds })
      .andWhere('asset.isDeleted = :isDeleted', { isDeleted: false })
      .groupBy('asset.viewId')
      .getRawMany();

    const countMap = new Map<string, number>();
    for (const result of results) {
      countMap.set(result.viewId, parseInt(result.count, 10));
    }

    return countMap;
  }

  /**
   * 批量更新现有资产的 searchable_text（用于数据迁移）
   * @param batchSize 每批处理数量，默认 1000
   */
  async batchUpdateSearchableText(batchSize: number = 1000): Promise<number> {
    let updated = 0;
    let offset = 0;

    while (true) {
      // 分批获取需要更新的资产
      const assets = await this.createQueryBuilder('asset')
        .where('asset.isDeleted = :isDeleted', { isDeleted: false })
        .andWhere('(asset.searchableText IS NULL OR asset.searchableText = :empty)', { empty: '' })
        .orderBy('asset.id', 'ASC')
        .skip(offset)
        .take(batchSize)
        .getMany();

      if (assets.length === 0) {
        break;
      }

      // 批量更新
      for (const asset of assets) {
        const searchableText = this.generateSearchableText({
          name: asset.name,
          displayName: asset.displayName,
          description: asset.description,
        });

        await this.update(
          { id: asset.id },
          { searchableText, updatedTimestamp: Date.now() }
        );

        updated++;
      }

      console.log(`Updated ${updated} assets...`);

      // 如果返回的数量少于 batchSize，说明已经处理完了
      if (assets.length < batchSize) {
        break;
      }

      offset += batchSize;
    }

    return updated;
  }
}
