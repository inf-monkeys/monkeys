import { DataViewEntity } from '@/database/entities/data-management/data-view.entity';
import { Injectable } from '@nestjs/common';
import { nanoid } from 'nanoid';
import { DataSource, Repository, Like, IsNull } from 'typeorm';

@Injectable()
export class DataViewRepository extends Repository<DataViewEntity> {
  constructor(private dataSource: DataSource) {
    super(DataViewEntity, dataSource.createEntityManager());
  }

  /**
   * 根据 ID 查找视图
   */
  async findById(id: string): Promise<DataViewEntity | null> {
    return this.findOne({
      where: { id, isDeleted: false },
    });
  }

  /**
   * 根据父 ID 查找子视图
   */
  async findByParentId(parentId: string | null, teamId?: string): Promise<DataViewEntity[]> {
    const where: any = {
      isDeleted: false,
    };

    if (parentId === null) {
      where.parentId = IsNull();
    } else {
      where.parentId = parentId;
    }

    if (teamId) {
      where.teamId = teamId;
    }

    return this.find({
      where,
      order: { sort: 'ASC', createdTimestamp: 'ASC' },
    });
  }

  /**
   * 根据路径查找所有子孙视图
   */
  async findDescendantsByPath(path: string): Promise<DataViewEntity[]> {
    // 特殊处理根路径的情况
    const searchPath = path === '/' ? '/' : `${path}/`;
    const likePattern = path === '/' ? '/%' : `${path}%`;

    return this.createQueryBuilder('view')
      .where('view.path LIKE :path', { path: likePattern })
      .andWhere('view.path != :exactPath', { exactPath: path })
      .andWhere('view.isDeleted = :isDeleted', { isDeleted: false })
      .orderBy('view.path', 'ASC')
      .getMany();
  }

  /**
   * 获取树形结构（所有根节点及其子节点）
   */
  async findTree(teamId?: string): Promise<DataViewEntity[]> {
    const where: any = { isDeleted: false };
    if (teamId) {
      where.teamId = teamId;
    }

    return this.find({
      where,
      order: { path: 'ASC', sort: 'ASC' },
    });
  }

  /**
   * 获取公开视图树形结构（只返回 isPublic = true 的视图）
   * 包括：1. team_id = 指定teamId 的视图，2. team_id = '0' 的全局视图（所有团队可见）
   */
  async findPublicTree(teamId?: string): Promise<DataViewEntity[]> {
    const baseWhere = { isDeleted: false, isPublic: true };

    // 如果指定了 teamId，返回该团队的视图 + 全局视图（team_id = '0'）
    // 如果没有指定 teamId，只返回全局视图
    const where = teamId
      ? [
          { ...baseWhere, teamId },      // 该团队的视图
          { ...baseWhere, teamId: '0' }  // 全局视图（team_id = '0'）
        ]
      : { ...baseWhere, teamId: '0' };   // 只返回全局视图

    return this.find({
      where,
      order: { path: 'ASC', sort: 'ASC' },
    });
  }

  /**
   * 创建视图
   */
  async createView(data: {
    name: string;
    description?: string;
    iconUrl?: string;
    parentId?: string;
    filterConfig?: any;
    displayConfig?: any;
    creatorUserId: string;
    teamId?: string;
    isPublic?: boolean;
    sort?: number;
  }): Promise<DataViewEntity> {
    const now = Date.now();
    const id = nanoid();
    let path: string;
    let level = 0;

    // 如果有父视图，需要计算路径和层级
    if (data.parentId) {
      const parent = await this.findById(data.parentId);
      if (!parent) {
        throw new Error('父视图不存在');
      }
      path = `${parent.path}${parent.id}/`;
      level = parent.level + 1;
    } else {
      // 根视图的 path 应该是 /<viewId>/
      path = `/${id}/`;
    }

    const view = this.create({
      id,
      ...data,
      path,
      level,
      assetCount: 0,
      createdTimestamp: now,
      updatedTimestamp: now,
      isDeleted: false,
    });

    return this.save(view);
  }

  /**
   * 更新视图
   */
  async updateView(
    id: string,
    updates: {
      name?: string;
      description?: string;
      iconUrl?: string;
      filterConfig?: any;
      displayConfig?: any;
      isPublic?: boolean;
      sort?: number;
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
   * 移动视图（更改父视图）
   */
  async moveView(id: string, newParentId: string | null): Promise<void> {
    const view = await this.findById(id);
    if (!view) {
      throw new Error('视图不存在');
    }

    let newPath = '/';
    let newLevel = 0;

    if (newParentId) {
      const newParent = await this.findById(newParentId);
      if (!newParent) {
        throw new Error('新父视图不存在');
      }

      // 检查是否形成循环引用
      if (newParent.path.startsWith(view.path)) {
        throw new Error('不能将视图移动到自己的子视图下');
      }

      newPath = `${newParent.path}${newParent.id}/`;
      newLevel = newParent.level + 1;
    }

    const oldPath = view.path;
    const levelDiff = newLevel - view.level;

    // 更新当前视图
    await this.update(
      { id },
      {
        parentId: newParentId,
        path: newPath,
        level: newLevel,
        updatedTimestamp: Date.now(),
      }
    );

    // 更新所有子孙视图的路径和层级
    const descendants = await this.findDescendantsByPath(oldPath);
    for (const descendant of descendants) {
      const newDescendantPath = descendant.path.replace(oldPath, newPath);
      const newDescendantLevel = descendant.level + levelDiff;

      await this.update(
        { id: descendant.id },
        {
          path: newDescendantPath,
          level: newDescendantLevel,
          updatedTimestamp: Date.now(),
        }
      );
    }
  }

  /**
   * 软删除视图（同时删除所有子孙视图）
   */
  async softDeleteView(id: string): Promise<void> {
    const view = await this.findById(id);
    if (!view) {
      throw new Error('视图不存在');
    }

    const now = Date.now();

    // 删除当前视图
    await this.update(
      { id },
      { isDeleted: true, updatedTimestamp: now }
    );

    // 删除所有子孙视图
    const descendants = await this.findDescendantsByPath(view.path);
    for (const descendant of descendants) {
      await this.update(
        { id: descendant.id },
        { isDeleted: true, updatedTimestamp: now }
      );
    }
  }

  /**
   * 更新视图的资产计数
   */
  async updateAssetCount(viewId: string, delta: number): Promise<void> {
    await this.increment({ id: viewId }, 'assetCount', delta);
  }

  /**
   * 搜索视图
   */
  async searchViews(keyword: string, teamId?: string): Promise<DataViewEntity[]> {
    const where: any = {
      isDeleted: false,
      name: Like(`%${keyword}%`),
    };

    if (teamId) {
      where.teamId = teamId;
    }

    return this.find({
      where,
      order: { createdTimestamp: 'DESC' },
    });
  }

  /**
   * 检查用户是否是视图的创建者
   */
  async isCreator(viewId: string, userId: string): Promise<boolean> {
    const view = await this.findOne({
      where: { id: viewId, creatorUserId: userId, isDeleted: false },
    });
    return !!view;
  }

  /**
   * 获取用户可访问的视图列表
   */
  async findAccessibleViews(userId: string, teamId?: string): Promise<DataViewEntity[]> {
    const where: any = {
      isDeleted: false,
    };

    if (teamId) {
      where.teamId = teamId;
    }

    // 获取公开的或用户创建的视图
    return this.find({
      where: [
        { ...where, isPublic: true },
        { ...where, creatorUserId: userId },
      ],
      order: { path: 'ASC', sort: 'ASC' },
    });
  }

  /**
   * 批量更新视图排序
   */
  async batchUpdateSort(items: Array<{ id: string; sort: number }>): Promise<void> {
    const now = Date.now();

    // 使用事务批量更新
    await this.manager.transaction(async (transactionalEntityManager) => {
      for (const item of items) {
        await transactionalEntityManager.update(
          DataViewEntity,
          { id: item.id, isDeleted: false },
          {
            sort: item.sort,
            updatedTimestamp: now,
          }
        );
      }
    });
  }
}
