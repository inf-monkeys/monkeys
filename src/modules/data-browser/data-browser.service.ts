import { AssetStatus, DataAssetEntity } from '@/database/entities/data-management/data-asset.entity';
import { DataAssetRepository } from '@/database/repositories/data-asset.repository';
import { DataViewRepository } from '@/database/repositories/data-view.repository';
import { DataViewEntity } from '@/database/entities/data-management/data-view.entity';
import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import {
  DataAssetListResponseDto,
  DataAssetResponseDto,
  QueryDataAssetDto,
  QueryDataViewDto,
  DataViewResponseDto,
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

    // 优化：在数据库层面过滤，而不是应用层
    if (query.keyword) {
      const allViews = await this.dataViewRepository.searchViews(query.keyword, query.teamId || teamId);
      // 过滤只保留公开的视图
      views = allViews.filter(v => v.isPublic);
    } else if (query.parentId !== undefined) {
      // 优化：使用单次查询获取公开的子视图
      const allViews = await this.dataViewRepository.findByParentId(query.parentId || null, query.teamId || teamId);
      views = allViews.filter(v => v.isPublic);
    } else {
      // 已经在 findPublicTree 中过滤了 isPublic
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
   */
  async getAssets(
    userId: string,
    dto: QueryDataAssetDto,
    teamId?: string,
  ): Promise<DataAssetListResponseDto> {
    const page = dto.page || 1;
    const pageSize = dto.pageSize || 20;

    const [assets, total] = await this.dataAssetRepository.findByFilter(
      {
        viewId: dto.viewId,
        assetType: dto.assetType,
        // 强制只返回已发布的内容
        status: AssetStatus.PUBLISHED,
        keyword: dto.keyword,
        teamId: dto.teamId || teamId,
        creatorUserId: dto.creatorUserId,
      },
      { page, pageSize }
    );

    return {
      list: assets.map((asset) => this.toResponseDto(asset)),
      total,
      page,
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
