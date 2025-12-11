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
    return this.createQueryBuilder('view')
      .where('view.path LIKE :path', { path: `${path}/%` })
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
    let path = '/';
    let level = 0;

    // 如果有父视图，需要计算路径和层级
    if (data.parentId) {
      const parent = await this.findById(data.parentId);
      if (!parent) {
        throw new Error('父视图不存在');
      }
      path = `${parent.path}${parent.id}/`;
      level = parent.level + 1;
    }

    const view = this.create({
      id: nanoid(),
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
}
