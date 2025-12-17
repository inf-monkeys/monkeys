import { AssetStatus, DataAssetEntity, DataAssetType } from '@/database/entities/data-management/data-asset.entity';
import { DataViewEntity } from '@/database/entities/data-management/data-view.entity';
import { Injectable } from '@nestjs/common';
import { nanoid } from 'nanoid';
import { DataSource, In, Repository } from 'typeorm';

export interface DataAssetFilter {
  viewId?: string;
  viewIds?: string[];
  assetType?: DataAssetType;
  status?: AssetStatus;
  creatorUserId?: string;
  teamId?: string;
  keyword?: string;
  excludeLargeFields?: boolean; // 是否排除大字段（primaryContent, properties）
}

export interface DataAssetPagination {
  page?: number;
  pageSize: number;
  // 游标分页优化（用于大数据量场景）
  cursorTimestamp?: number; // 上一页最后一条的 updatedTimestamp
  cursorId?: string; // 上一页最后一条的 id（解决时间戳相同的情况）
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
    await this.update(
      { id, isDeleted: false },
      {
        ...updates,
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
   * 批量更新资产状态（单次 SQL 优化）
   */
  async batchUpdateStatus(ids: string[], status: AssetStatus): Promise<void> {
    if (ids.length === 0) return;

    await this.update(
      { id: In(ids), isDeleted: false },
      {
        status,
        updatedTimestamp: Date.now(),
      }
    );
  }

  /**
   * 批量发布资产（单次 SQL 优化）
   */
  async batchPublishAssets(ids: string[]): Promise<void> {
    if (ids.length === 0) return;

    await this.update(
      { id: In(ids), isDeleted: false, isPublished: false },
      {
        isPublished: true,
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

    // 如果需要排除大字段，使用 select 指定要查询的字段
    if (filter.excludeLargeFields) {
      query.select([
        'asset.id',
        'asset.name',
        'asset.viewId',
        'asset.assetType',
        'asset.keywords',
        'asset.thumbnail',
        'asset.media',
        'asset.viewCount',
        'asset.downloadCount',
        'asset.status',
        'asset.teamId',
        'asset.creatorUserId',
        'asset.displayName',
        'asset.isPublished',
        'asset.createdTimestamp',
        'asset.updatedTimestamp',
        // 排除 primaryContent, properties 和 description
      ]);
    }

    // 优化：优先应用高选择性条件，减少扫描范围

    // 1. 优先：status 条件（通常只查询 published）
    if (filter.status) {
      query.andWhere('asset.status = :status', { status: filter.status });
    }

    // 2. 优先：teamId 条件（有效过滤）
    if (filter.teamId) {
      query.andWhere('(asset.teamId = :teamId OR asset.teamId = :globalTeamId)', {
        teamId: filter.teamId,
        globalTeamId: '0'
      });
    }

    // 3. viewIds 优先于 viewId（如果传了 viewIds，就忽略 viewId）
    if (filter.viewIds && filter.viewIds.length > 0) {
      query.andWhere('asset.viewId IN (:...viewIds)', { viewIds: filter.viewIds });
    } else if (filter.viewId) {
      query.andWhere('asset.viewId = :viewId', { viewId: filter.viewId });
    }

    if (filter.assetType) {
      query.andWhere('asset.assetType = :assetType', { assetType: filter.assetType });
    }

    if (filter.creatorUserId) {
      query.andWhere('asset.creatorUserId = :creatorUserId', { creatorUserId: filter.creatorUserId });
    }

    // 关键词搜索放在最后（最耗时）
    if (filter.keyword) {
      // 优化：只搜索 name 和 displayName，避免扫描大字段 description
      query.andWhere('(asset.name LIKE :keyword OR asset.displayName LIKE :keyword)', {
        keyword: `%${filter.keyword}%`,
      });
    }

    query.orderBy('asset.updatedTimestamp', 'DESC')
      .addOrderBy('asset.id', 'DESC'); // 添加 id 排序，确保稳定排序

    if (pagination) {
      const { page, pageSize, cursorTimestamp, cursorId } = pagination;

      // 优化：使用游标分页（性能更好，避免大偏移量）
      if (cursorTimestamp && cursorId) {
        // 游标分页：查询比游标更旧的数据
        query.andWhere(
          '(asset.updatedTimestamp < :cursorTimestamp OR (asset.updatedTimestamp = :cursorTimestamp AND asset.id < :cursorId))',
          { cursorTimestamp, cursorId }
        );
        query.take(pageSize);
      } else if (page) {
        // 传统分页：仅用于首页或兼容旧逻辑
        // 警告：大偏移量性能差，建议迁移到游标分页
        query.skip((page - 1) * pageSize).take(pageSize);
      } else {
        query.take(pageSize);
      }
    }

    return query.getManyAndCount();
  }

  /**
   * 查询视图及其所有子孙视图的资产（性能优化版本）
   * 使用 JOIN 减少查询次数，从 3 次降到 1 次
   */
  async findByViewWithDescendants(
    viewPath: string,
    filter: DataAssetFilter,
    pagination?: DataAssetPagination
  ): Promise<[DataAssetEntity[], number]> {
    const query = this.createQueryBuilder('asset')
      .innerJoin(DataViewEntity, 'view', 'asset.viewId = view.id')
      .where('asset.isDeleted = :isDeleted', { isDeleted: false })
      .andWhere('view.isDeleted = :viewIsDeleted', { viewIsDeleted: false });

    // 查询该视图路径及其所有子孙视图的资产
    // viewPath 格式为 /<id>/ 或 /<parentId>/<id>/，以 / 结尾
    // 匹配规则：
    // 1. 自己：view.path = viewPath
    // 2. 子孙视图：view.path LIKE 'viewPath_%'（路径以 viewPath 开头，且后面至少还有一个字符）
    query.andWhere('(view.path = :viewPath OR view.path LIKE :viewPathPattern)', {
      viewPath,
      viewPathPattern: `${viewPath}_%`,
    });


    // 如果需要排除大字段，使用 select 指定要查询的字段
    if (filter.excludeLargeFields) {
      query.select([
        'asset.id',
        'asset.name',
        'asset.viewId',
        'asset.assetType',
        'asset.thumbnail',
        'asset.media',
        'asset.viewCount',
        'asset.downloadCount',
        'asset.status',
        'asset.teamId',
        'asset.creatorUserId',
        'asset.displayName',
        'asset.isPublished',
        'asset.keywords',
        'asset.createdTimestamp',
        'asset.updatedTimestamp',
      ]);
    }

    // 应用其他筛选条件
    if (filter.status) {
      query.andWhere('asset.status = :status', { status: filter.status });
    }

    if (filter.teamId) {
      query.andWhere('(asset.teamId = :teamId OR asset.teamId = :globalTeamId)', {
        teamId: filter.teamId,
        globalTeamId: '0'
      });
    }

    if (filter.assetType) {
      query.andWhere('asset.assetType = :assetType', { assetType: filter.assetType });
    }

    if (filter.creatorUserId) {
      query.andWhere('asset.creatorUserId = :creatorUserId', { creatorUserId: filter.creatorUserId });
    }

    if (filter.keyword) {
      query.andWhere('(asset.name LIKE :keyword OR asset.displayName LIKE :keyword)', {
        keyword: `%${filter.keyword}%`,
      });
    }

    query.orderBy('asset.updatedTimestamp', 'DESC')
      .addOrderBy('asset.id', 'DESC');

    if (pagination) {
      const { page, pageSize, cursorTimestamp, cursorId } = pagination;

      if (cursorTimestamp && cursorId) {
        query.andWhere(
          '(asset.updatedTimestamp < :cursorTimestamp OR (asset.updatedTimestamp = :cursorTimestamp AND asset.id < :cursorId))',
          { cursorTimestamp, cursorId }
        );
        query.take(pageSize);
      } else if (page) {
        query.skip((page - 1) * pageSize).take(pageSize);
      } else {
        query.take(pageSize);
      }
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
}
