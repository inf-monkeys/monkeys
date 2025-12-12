import { Injectable, NotFoundException, ForbiddenException, BadRequestException } from '@nestjs/common';
import { DataViewRepository } from '@/database/repositories/data-view.repository';
import { DataViewPermissionRepository } from '@/database/repositories/data-permission.repository';
import { DataAssetRepository } from '@/database/repositories/data-asset.repository';
import { DataViewEntity } from '@/database/entities/data-management/data-view.entity';
import { PermissionType } from '@/database/entities/data-management/data-permission.entity';
import {
  CreateDataViewDto,
  UpdateDataViewDto,
  MoveDataViewDto,
  QueryDataViewDto,
  DataViewResponseDto,
  BatchUpdateViewSortDto,
} from './dto/data-view.dto';

@Injectable()
export class DataViewService {
  constructor(
    private readonly dataViewRepository: DataViewRepository,
    private readonly dataViewPermissionRepository: DataViewPermissionRepository,
    private readonly dataAssetRepository: DataAssetRepository,
  ) {}

  /**
   * 创建视图
   */
  async createView(userId: string, dto: CreateDataViewDto): Promise<DataViewResponseDto> {
    const view = await this.dataViewRepository.createView({
      ...dto,
      creatorUserId: userId,
    });

    return this.toResponseDto(view);
  }

  /**
   * 获取视图详情
   */
  async getView(viewId: string, userId: string): Promise<DataViewResponseDto> {
    const view = await this.dataViewRepository.findById(viewId);
    if (!view) {
      throw new NotFoundException('视图不存在');
    }

    // 检查权限
    await this.checkPermission(viewId, userId, 'read');

    return this.toResponseDto(view);
  }

  /**
   * 获取视图列表
   */
  async listViews(userId: string, query: QueryDataViewDto): Promise<DataViewResponseDto[]> {
    let views: DataViewEntity[];

    if (query.keyword) {
      // 搜索模式
      views = await this.dataViewRepository.searchViews(query.keyword, query.teamId);
    } else if (query.parentId !== undefined) {
      // 按父视图查询
      views = await this.dataViewRepository.findByParentId(query.parentId || null, query.teamId);
    } else {
      // 获取用户可访问的所有视图
      views = await this.dataViewRepository.findAccessibleViews(userId, query.teamId);
    }

    // 过滤用户有权限访问的视图
    const accessibleViews = await this.filterAccessibleViews(views, userId);

    return accessibleViews.map(view => this.toResponseDto(view));
  }

  /**
   * 获取树形结构
   */
  async getViewTree(userId: string, teamId?: string): Promise<DataViewResponseDto[]> {
    const views = await this.dataViewRepository.findAccessibleViews(userId, teamId);
    const accessibleViews = await this.filterAccessibleViews(views, userId);

    return this.buildTree(accessibleViews);
  }

  /**
   * 更新视图
   */
  async updateView(viewId: string, userId: string, dto: UpdateDataViewDto): Promise<void> {
    const view = await this.dataViewRepository.findById(viewId);
    if (!view) {
      throw new NotFoundException('视图不存在');
    }

    // 检查权限
    await this.checkPermission(viewId, userId, 'write');

    await this.dataViewRepository.updateView(viewId, dto);
  }

  /**
   * 移动视图
   */
  async moveView(viewId: string, userId: string, dto: MoveDataViewDto): Promise<void> {
    const view = await this.dataViewRepository.findById(viewId);
    if (!view) {
      throw new NotFoundException('视图不存在');
    }

    // 检查权限
    await this.checkPermission(viewId, userId, 'write');

    // 如果有新父视图，检查新父视图的权限
    if (dto.newParentId) {
      await this.checkPermission(dto.newParentId, userId, 'write');
    }

    await this.dataViewRepository.moveView(viewId, dto.newParentId || null);
  }

  /**
   * 删除视图
   */
  async deleteView(viewId: string, userId: string): Promise<void> {
    const view = await this.dataViewRepository.findById(viewId);
    if (!view) {
      throw new NotFoundException('视图不存在');
    }

    // 检查权限
    await this.checkPermission(viewId, userId, 'delete');

    // 检查是否有子视图
    const children = await this.dataViewRepository.findByParentId(viewId);
    if (children.length > 0) {
      throw new BadRequestException('该视图下有子视图，请先删除子视图');
    }

    // 检查是否有资产
    const assetCount = await this.dataAssetRepository.countByViewId(viewId);
    if (assetCount > 0) {
      throw new BadRequestException('该视图下有资产，请先删除或移动资产');
    }

    await this.dataViewRepository.softDeleteView(viewId);
  }

  /**
   * 批量更新视图排序
   */
  async batchUpdateSort(userId: string, dto: BatchUpdateViewSortDto): Promise<void> {
    // 检查所有视图的权限
    for (const item of dto.items) {
      await this.checkPermission(item.id, userId, 'write');
    }

    // 批量更新排序
    await this.dataViewRepository.batchUpdateSort(dto.items);
  }

  /**
   * 检查权限
   */
  async checkPermission(
    viewId: string,
    userId: string,
    requiredPermission: PermissionType
  ): Promise<{ hasPermission: boolean; permission?: PermissionType; source?: string }> {
    const view = await this.dataViewRepository.findById(viewId);
    if (!view) {
      throw new NotFoundException('视图不存在');
    }

    // 1. 检查是否是创建者
    if (view.creatorUserId === userId) {
      return { hasPermission: true, permission: 'admin', source: 'creator' };
    }

    // 2. 检查是否是公开视图（公开视图所有人都可以读）
    if (view.isPublic && requiredPermission === 'read') {
      return { hasPermission: true, permission: 'read', source: 'public' };
    }

    // 3. 检查直接权限
    const directPermission = await this.dataViewPermissionRepository.findUserPermission(viewId, userId);
    if (directPermission) {
      const hasPermission = this.comparePermission(directPermission.permission, requiredPermission);
      if (hasPermission) {
        return { hasPermission: true, permission: directPermission.permission, source: 'direct' };
      }
    }

    // 4. 检查继承权限（从父视图继承）
    if (view.parentId) {
      const parentPermission = await this.checkPermission(view.parentId, userId, requiredPermission);
      if (parentPermission.hasPermission) {
        return { hasPermission: true, permission: parentPermission.permission, source: 'inherited' };
      }
    }

    // 无权限
    throw new ForbiddenException('无权访问该视图');
  }

  /**
   * 比较权限等级
   */
  private comparePermission(userPermission: PermissionType, requiredPermission: PermissionType): boolean {
    const permissionLevels: Record<PermissionType, number> = {
      read: 1,
      write: 2,
      delete: 3,
      admin: 4,
    };

    return permissionLevels[userPermission] >= permissionLevels[requiredPermission];
  }

  /**
   * 过滤用户有权限访问的视图
   */
  private async filterAccessibleViews(views: DataViewEntity[], userId: string): Promise<DataViewEntity[]> {
    const accessibleViews: DataViewEntity[] = [];

    for (const view of views) {
      try {
        await this.checkPermission(view.id, userId, 'read');
        accessibleViews.push(view);
      } catch (error) {
        // 无权限，跳过
      }
    }

    return accessibleViews;
  }

  /**
   * 构建树形结构
   */
  private buildTree(views: DataViewEntity[]): DataViewResponseDto[] {
    const viewMap = new Map<string, DataViewResponseDto>();
    const rootViews: DataViewResponseDto[] = [];

    // 先创建所有节点
    for (const view of views) {
      const dto = this.toResponseDto(view);
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
   * 实体转响应 DTO
   */
  private toResponseDto(entity: DataViewEntity): DataViewResponseDto {
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
