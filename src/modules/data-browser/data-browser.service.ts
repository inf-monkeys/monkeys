import { AssetStatus, DataAssetEntity } from '@/database/entities/data-management/data-asset.entity';
import { DataViewEntity } from '@/database/entities/data-management/data-view.entity';
import { DataAssetRepository } from '@/database/repositories/data-asset.repository';
import { DataViewRepository } from '@/database/repositories/data-view.repository';
import { BadRequestException, ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import {
  DataAssetListResponseDto,
  DataAssetNextPageResponseDto,
  DataAssetResponseDto,
  DataViewResponseDto,
  QueryDataAssetDto,
  QueryDataViewDto,
} from './dto';

@Injectable()
export class DataBrowserService {
  constructor(
    private readonly dataAssetRepository: DataAssetRepository,
    private readonly dataViewRepository: DataViewRepository,
  ) {}

  /**
   * 获取视图树形结构（只读）
   * 数据浏览器只显示公开的视图分类（isPublic = true）
   */
  async getViewTree(userId: string, teamId?: string): Promise<DataViewResponseDto[]> {
    const views = await this.dataViewRepository.findPublicTree(teamId);
    return this.buildTree(views);
  }

  /**
   * 获取视图列表（只读）
   * 数据浏览器只显示公开的视图分类（isPublic = true）
   */
  async listViews(
    userId: string,
    query: QueryDataViewDto,
    teamId?: string,
  ): Promise<DataViewResponseDto[]> {
    let views: DataViewEntity[];

    if (query.keyword) {
      views = await this.dataViewRepository.searchViews(query.keyword, query.teamId || teamId);
      // 过滤只保留公开的视图
      views = views.filter(v => v.isPublic);
    } else if (query.parentId !== undefined) {
      views = await this.dataViewRepository.findByParentId(query.parentId || null, query.teamId || teamId);
      // 过滤只保留公开的视图
      views = views.filter(v => v.isPublic);
    } else {
      views = await this.dataViewRepository.findPublicTree(query.teamId || teamId);
    }

    return views;
  }

  /**
   * 获取视图详情（只读）
   * 只能访问公开的视图
   */
  async getView(id: string, userId: string): Promise<DataViewResponseDto> {
    const view = await this.dataViewRepository.findById(id);
    if (!view) {
      throw new NotFoundException(`View with ID ${id} not found`);
    }

    // 确保只能访问公开的视图
    if (!view.isPublic) {
      throw new ForbiddenException('This view is not public');
    }

    return view;
  }

  /**
   * 获取资产列表（只读）
   * 只返回已发布的资产
   * 如果指定了 viewId，会返回该视图及其所有子视图的资产
   * 优化：使用 JOIN 查询，从 3 次查询降到 1-2 次
   */
  async getAssets(
    userId: string,
    dto: QueryDataAssetDto,
    teamId?: string,
  ): Promise<DataAssetListResponseDto> {
    const page = dto.page || 1;
    const pageSize = dto.pageSize || 20;

    let assets: DataAssetEntity[];
    let total: number;

    // 优化：如果指定了 viewId，使用 JOIN 查询获取该视图及所有子孙视图的资产
    if (dto.viewId) {
      // 先获取视图信息（单次查询）
      const view = await this.dataViewRepository.findById(dto.viewId);

      if (view) {
        // 先把子树视图 ID 收敛出来，再用 asset.viewId IN (...) 过滤
        // 避免在按 updatedTimestamp 扫描时再做 view JOIN 过滤导致大量跳过行（子树稀疏时会非常慢）。
        const descendants = await this.dataViewRepository.findDescendantsByPath(view.path);
        const viewIds = [view.id, ...descendants.map((v) => v.id)];

        [assets, total] = await this.dataAssetRepository.findByFilter(
          {
            viewIds,
            assetType: dto.assetType,
            status: AssetStatus.PUBLISHED, // 强制只返回已发布的内容
            keyword: dto.keyword,
            teamId: dto.teamId || teamId,
            creatorUserId: dto.creatorUserId,
            excludeLargeFields: true, // 列表查询时排除大字段
          },
          {
            page,
            pageSize,
            cursorTimestamp: dto.cursorTimestamp,
            cursorId: dto.cursorId,
          }
        );
      } else {
        // 视图不存在，返回空结果
        assets = [];
        total = 0;
      }
    } else {
      // 没有指定 viewId，使用普通查询
      [assets, total] = await this.dataAssetRepository.findByFilter(
        {
          assetType: dto.assetType,
          status: AssetStatus.PUBLISHED, // 强制只返回已发布的内容
          keyword: dto.keyword,
          teamId: dto.teamId || teamId,
          creatorUserId: dto.creatorUserId,
          excludeLargeFields: true, // 列表查询时排除大字段
        },
        {
          page,
          pageSize,
          cursorTimestamp: dto.cursorTimestamp,
          cursorId: dto.cursorId,
        }
      );
    }

    return {
      list: assets.map((asset) => this.toResponseDto(asset)),
      total,
      page,
      pageSize,
    };
  }

  /**
   * 获取资产下一页（只读，不返回 total）
   * 用于滚动加载场景：避免 getManyAndCount() 带来的 COUNT(*) 开销。
   */
  async getAssetsNextPage(
    userId: string,
    dto: QueryDataAssetDto,
    teamId?: string,
  ): Promise<DataAssetNextPageResponseDto> {
    const pageSize = dto.pageSize || 20;

    if (!dto.cursorTimestamp || !dto.cursorId) {
      throw new BadRequestException('cursorTimestamp and cursorId are required for nextpage');
    }

    let assets: DataAssetEntity[];
    let hasMore: boolean;

    if (dto.viewId) {
      const view = await this.dataViewRepository.findById(dto.viewId);
      if (!view) {
        return { list: [], hasMore: false, pageSize };
      }

      const descendants = await this.dataViewRepository.findDescendantsByPath(view.path);
      const viewIds = [view.id, ...descendants.map((v) => v.id)];

      ({ list: assets, hasMore } = await this.dataAssetRepository.findByFilterNextPage(
        {
          viewIds,
          assetType: dto.assetType,
          status: AssetStatus.PUBLISHED,
          keyword: dto.keyword,
          teamId: dto.teamId || teamId,
          creatorUserId: dto.creatorUserId,
          excludeLargeFields: true,
        },
        {
          pageSize,
          cursorTimestamp: dto.cursorTimestamp,
          cursorId: dto.cursorId,
        }
      ));
    } else {
      ({ list: assets, hasMore } = await this.dataAssetRepository.findByFilterNextPage(
        {
          assetType: dto.assetType,
          status: AssetStatus.PUBLISHED,
          keyword: dto.keyword,
          teamId: dto.teamId || teamId,
          creatorUserId: dto.creatorUserId,
          excludeLargeFields: true,
      },
      {
        pageSize,
        cursorTimestamp: dto.cursorTimestamp,
        cursorId: dto.cursorId,
      }
    ));
    }

    return {
      list: assets.map((asset) => this.toResponseDto(asset)),
      hasMore,
      pageSize,
    };
  }

  /**
   * 获取单个资产（只读）
   * 只能访问已发布的资产
   */
  async getAsset(userId: string, assetId: string): Promise<DataAssetResponseDto> {
    const asset = await this.dataAssetRepository.findById(assetId);
    if (!asset) {
      throw new NotFoundException(`Asset with ID ${assetId} not found`);
    }

    // 确保只能访问已发布的内容
    if (asset.status !== AssetStatus.PUBLISHED && !asset.isPublished) {
      throw new ForbiddenException('This asset is not published');
    }

    return this.toResponseDto(asset);
  }

  /**
   * 转换为响应 DTO
   */
  private toResponseDto(asset: DataAssetEntity): DataAssetResponseDto {
    return {
      id: asset.id,
      name: asset.name,
      viewId: asset.viewId,
      assetType: asset.assetType,
      primaryContent: asset.primaryContent,
      properties: asset.properties,
      files: asset.files,
      media: asset.media,
      thumbnail: asset.thumbnail,
      keywords: this.parseKeywords(asset.keywords),
      viewCount: asset.viewCount,
      downloadCount: asset.downloadCount,
      status: asset.status,
      teamId: asset.teamId,
      creatorUserId: asset.creatorUserId,
      displayName: typeof asset.displayName === 'string' ? asset.displayName : asset.displayName?.en || asset.name,
      description: typeof asset.description === 'string' ? asset.description : asset.description?.en || undefined,
      isPublished: asset.isPublished,
      createdTimestamp: asset.createdTimestamp,
      updatedTimestamp: asset.updatedTimestamp,
    };
  }

  /**
   * keywords 列目前为 string：
   * - 绝大多数情况：单个关键词（无分隔符）
   * - 兼容未来：支持逗号/分号/换行/竖线分隔
   */
  private parseKeywords(raw?: string | null): string[] {
    if (!raw) return [];
    const trimmed = raw.trim();
    if (!trimmed) return [];

    const parts = trimmed
      .split(/[,，;；\n\r|]+/g)
      .map((s) => s.trim())
      .filter(Boolean);

    // 去重（保持顺序）
    const seen = new Set<string>();
    const result: string[] = [];
    for (const p of parts) {
      if (!seen.has(p)) {
        seen.add(p);
        result.push(p);
      }
    }
    return result;
  }

  /**
   * 构建树形结构
   */
  private buildTree(views: DataViewEntity[]): DataViewResponseDto[] {
    const viewMap = new Map<string, DataViewResponseDto>();
    const rootViews: DataViewResponseDto[] = [];

    // 先创建所有节点
    for (const view of views) {
      const dto = this.toViewResponseDto(view);
      dto.children = [];
      viewMap.set(view.id, dto);
    }

    // 构建树形关系
    for (const view of views) {
      const dto = viewMap.get(view.id)!;

      if (!view.parentId) {
        // 根节点
        rootViews.push(dto);
      } else {
        // 子节点
        const parent = viewMap.get(view.parentId);
        if (parent) {
          parent.children!.push(dto);
        } else {
          // 父节点不在可访问列表中，视为根节点
          rootViews.push(dto);
        }
      }
    }

    return rootViews;
  }

  /**
   * 视图实体转响应 DTO
   */
  private toViewResponseDto(entity: DataViewEntity): DataViewResponseDto {
    return {
      id: entity.id,
      name: entity.name,
      description: entity.description,
      iconUrl: entity.iconUrl,
      parentId: entity.parentId,
      path: entity.path,
      level: entity.level,
      sort: entity.sort,
      filterConfig: entity.filterConfig,
      displayConfig: entity.displayConfig,
      creatorUserId: entity.creatorUserId,
      teamId: entity.teamId,
      isPublic: entity.isPublic,
      assetCount: entity.assetCount,
      createdTimestamp: entity.createdTimestamp,
      updatedTimestamp: entity.updatedTimestamp,
    };
  }
}
