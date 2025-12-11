import { Injectable, NotFoundException } from '@nestjs/common';
import { DataAssetRepository } from '@/database/repositories/data-asset.repository';
import { DataAssetPermissionRepository } from '@/database/repositories/data-permission.repository';
import { DataViewRepository } from '@/database/repositories/data-view.repository';
import {
  CreateDataAssetDto,
  UpdateDataAssetDto,
  QueryDataAssetDto,
  DataAssetResponseDto,
  DataAssetListResponseDto,
} from './dto/data-asset.dto';
import { DataAssetEntity } from '@/database/entities/data-management/data-asset.entity';

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
      creatorUserId: userId,
      teamId: dto.teamId || view.teamId,
      iconUrl: dto.iconUrl,
      displayName: dto.displayName,
      description: dto.description,
      status: dto.status,
      sort: dto.sort,
    });

    return this.toResponseDto(asset);
  }

  /**
   * 获取资产列表
   */
  async getAssets(
    userId: string,
    dto: QueryDataAssetDto,
  ): Promise<DataAssetListResponseDto> {
    const page = dto.page || 1;
    const pageSize = dto.pageSize || 20;

    const [assets, total] = await this.dataAssetRepository.findByFilter(
      {
        viewId: dto.viewId,
        assetType: dto.assetType,
        status: dto.status,
        keyword: dto.keyword,
        teamId: dto.teamId,
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
      iconUrl: dto.iconUrl,
      primaryContent: dto.primaryContent,
      properties: dto.properties,
      files: dto.files,
      status: dto.status,
      sort: dto.sort,
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
   * 转换为响应 DTO
   */
  private toResponseDto(asset: DataAssetEntity): DataAssetResponseDto {
    return {
      id: asset.id,
      name: asset.name,
      viewId: asset.viewId,
      assetType: asset.dataAssetType,
      primaryContent: asset.primaryContent,
      properties: asset.properties,
      files: asset.files,
      viewCount: asset.viewCount,
      downloadCount: asset.downloadCount,
      status: asset.status,
      publishedAt: asset.publishedAt,
      teamId: asset.teamId,
      creatorUserId: asset.creatorUserId,
      iconUrl: asset.iconUrl,
      displayName: typeof asset.displayName === 'string' ? asset.displayName : asset.displayName?.en || asset.name,
      description: typeof asset.description === 'string' ? asset.description : asset.description?.en || undefined,
      isPreset: asset.isPreset,
      isPublished: asset.isPublished,
      sort: asset.sort,
      createdTimestamp: asset.createdTimestamp,
      updatedTimestamp: asset.updatedTimestamp,
    };
  }
}
