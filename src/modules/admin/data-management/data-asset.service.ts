import { DataAssetEntity, AssetStatus } from '@/database/entities/data-management/data-asset.entity';
import { DataAssetRepository } from '@/database/repositories/data-asset.repository';
import { DataAssetPermissionRepository } from '@/database/repositories/data-permission.repository';
import { DataViewRepository } from '@/database/repositories/data-view.repository';
import { Injectable, NotFoundException } from '@nestjs/common';
import {
  CreateDataAssetDto,
  DataAssetListResponseDto,
  DataAssetResponseDto,
  QueryDataAssetDto,
  UpdateDataAssetDto,
} from './dto/data-asset.dto';

@Injectable()
export class DataAssetService {
  constructor(
    private readonly dataAssetRepository: DataAssetRepository,
    private readonly dataAssetPermissionRepository: DataAssetPermissionRepository,
    private readonly dataViewRepository: DataViewRepository,
  ) {}

  /**
   * 创建资产
   */
  async createAsset(
    userId: string,
    dto: CreateDataAssetDto,
  ): Promise<DataAssetResponseDto> {
    // 验证视图是否存在
    const view = await this.dataViewRepository.findById(dto.viewId);
    if (!view) {
      throw new NotFoundException(`View with ID ${dto.viewId} not found`);
    }

    // 创建资产
    const asset = await this.dataAssetRepository.createAsset({
      name: dto.name,
      viewId: dto.viewId,
      assetType: dto.assetType,
      primaryContent: dto.primaryContent,
      properties: dto.properties,
      files: dto.files,
      media: dto.media,
      thumbnail: dto.thumbnail,
      creatorUserId: userId,
      teamId: dto.teamId || view.teamId,
      displayName: dto.displayName,
      description: dto.description,
      status: dto.status,
    });

    return this.toResponseDto(asset);
  }

  /**
   * 获取资产列表
   * 如果指定了 viewId，会返回该视图及其所有子视图的资产
   * 优化：使用 JOIN 查询，从 3 次查询降到 1-2 次
   */
  async getAssets(
    userId: string,
    dto: QueryDataAssetDto,
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
        // 使用优化的 JOIN 查询（单次查询，包含所有子孙视图的资产）
        [assets, total] = await this.dataAssetRepository.findByViewWithDescendants(
          view.path,
          {
            assetType: dto.assetType,
            status: dto.status,
            keyword: dto.keyword,
            teamId: dto.teamId,
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
          status: dto.status,
          keyword: dto.keyword,
          teamId: dto.teamId,
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
   * 获取单个资产
   */
  async getAsset(userId: string, assetId: string): Promise<DataAssetResponseDto> {
    const asset = await this.dataAssetRepository.findById(assetId);
    if (!asset) {
      throw new NotFoundException(`Asset with ID ${assetId} not found`);
    }

    return this.toResponseDto(asset);
  }

  /**
   * 更新资产
   */
  async updateAsset(
    userId: string,
    assetId: string,
    dto: UpdateDataAssetDto,
  ): Promise<DataAssetResponseDto> {
    const asset = await this.dataAssetRepository.findById(assetId);
    if (!asset) {
      throw new NotFoundException(`Asset with ID ${assetId} not found`);
    }

    // 更新资产
    await this.dataAssetRepository.updateAsset(assetId, {
      name: dto.name,
      displayName: dto.displayName,
      description: dto.description,
      primaryContent: dto.primaryContent,
      properties: dto.properties,
      files: dto.files,
      media: dto.media,
      thumbnail: dto.thumbnail,
      status: dto.status,
    });

    // 如果需要发布，单独处理
    if (dto.status === 'published' && !asset.isPublished) {
      await this.dataAssetRepository.publishAsset(assetId);
    }

    // 重新获取更新后的资产
    const updatedAsset = await this.dataAssetRepository.findById(assetId);
    return this.toResponseDto(updatedAsset);
  }

  /**
   * 删除资产
   */
  async deleteAsset(userId: string, assetId: string): Promise<void> {
    const asset = await this.dataAssetRepository.findById(assetId);
    if (!asset) {
      throw new NotFoundException(`Asset with ID ${assetId} not found`);
    }

    await this.dataAssetRepository.softDeleteAsset(assetId);
  }

  /**
   * 批量删除资产
   */
  async batchDeleteAssets(userId: string, assetIds: string[]): Promise<void> {
    await this.dataAssetRepository.batchSoftDelete(assetIds);
  }

  /**
   * 批量更新资产状态
   * 优化：使用单次 SQL 批量更新，避免 N+1 查询问题
   */
  async batchUpdateStatus(
    userId: string,
    assetIds: string[],
    status: AssetStatus
  ): Promise<void> {
    if (assetIds.length === 0) return;

    // 批量更新状态（单次 SQL）
    await this.dataAssetRepository.batchUpdateStatus(assetIds, status);

    // 如果状态是 published，需要同时更新 isPublished 字段（单次 SQL）
    if (status === AssetStatus.PUBLISHED) {
      await this.dataAssetRepository.batchPublishAssets(assetIds);
    }
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
}
