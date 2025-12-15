import {
  DataViewPermissionEntity,
  DataAssetPermissionEntity,
  PermissionType,
} from '@/database/entities/data-management/data-permission.entity';
import { Injectable } from '@nestjs/common';
import { nanoid } from 'nanoid';
import { DataSource, Repository, In } from 'typeorm';

@Injectable()
export class DataViewPermissionRepository extends Repository<DataViewPermissionEntity> {
  constructor(private dataSource: DataSource) {
    super(DataViewPermissionEntity, dataSource.createEntityManager());
  }

  /**
   * 查找视图的所有权限
   */
  async findByViewId(viewId: string): Promise<DataViewPermissionEntity[]> {
    return this.find({
      where: { viewId, isDeleted: false },
    });
  }

  /**
   * 查找用户在视图上的权限
   */
  async findUserPermission(viewId: string, userId: string): Promise<DataViewPermissionEntity | null> {
    return this.findOne({
      where: { viewId, userId, isDeleted: false },
    });
  }

  /**
   * 批量查找用户在多个视图上的权限（性能优化）
   * @returns Map<viewId, permission>
   */
  async findUserPermissionsBatch(
    viewIds: string[],
    userId: string
  ): Promise<Map<string, PermissionType>> {
    if (viewIds.length === 0) {
      return new Map();
    }

    const permissions = await this.find({
      where: {
        viewId: In(viewIds),
        userId,
        isDeleted: false,
      },
    });

    const permissionMap = new Map<string, PermissionType>();
    for (const permission of permissions) {
      permissionMap.set(permission.viewId, permission.permission);
    }

    return permissionMap;
  }

  /**
   * 查找角色在视图上的权限
   */
  async findRolePermissions(viewId: string, roleIds: string[]): Promise<DataViewPermissionEntity[]> {
    if (!roleIds.length) return [];

    return this.find({
      where: {
        viewId,
        roleId: In(roleIds),
        isDeleted: false,
      },
    });
  }

  /**
   * 添加权限
   */
  async addPermission(data: {
    viewId: string;
    userId?: string;
    roleId?: string;
    permission: PermissionType;
  }): Promise<DataViewPermissionEntity> {
    if (!data.userId && !data.roleId) {
      throw new Error('userId 或 roleId 必须提供其中之一');
    }

    const now = Date.now();
    const permission = this.create({
      id: nanoid(),
      ...data,
      createdTimestamp: now,
      updatedTimestamp: now,
      isDeleted: false,
    });

    return this.save(permission);
  }

  /**
   * 更新权限
   */
  async updatePermission(id: string, permission: PermissionType): Promise<void> {
    await this.update(
      { id, isDeleted: false },
      {
        permission,
        updatedTimestamp: Date.now(),
      }
    );
  }

  /**
   * 删除权限
   */
  async removePermission(id: string): Promise<void> {
    await this.update(
      { id, isDeleted: false },
      {
        isDeleted: true,
        updatedTimestamp: Date.now(),
      }
    );
  }

  /**
   * 批量删除视图的所有权限
   */
  async removeAllPermissions(viewId: string): Promise<void> {
    await this.update(
      { viewId, isDeleted: false },
      {
        isDeleted: true,
        updatedTimestamp: Date.now(),
      }
    );
  }
}

@Injectable()
export class DataAssetPermissionRepository extends Repository<DataAssetPermissionEntity> {
  constructor(private dataSource: DataSource) {
    super(DataAssetPermissionEntity, dataSource.createEntityManager());
  }

  /**
   * 查找资产的所有权限
   */
  async findByAssetId(assetId: string): Promise<DataAssetPermissionEntity[]> {
    return this.find({
      where: { assetId, isDeleted: false },
    });
  }

  /**
   * 查找用户在资产上的权限
   */
  async findUserPermission(assetId: string, userId: string): Promise<DataAssetPermissionEntity | null> {
    return this.findOne({
      where: { assetId, userId, isDeleted: false },
    });
  }

  /**
   * 查找角色在资产上的权限
   */
  async findRolePermissions(assetId: string, roleIds: string[]): Promise<DataAssetPermissionEntity[]> {
    if (!roleIds.length) return [];

    return this.find({
      where: {
        assetId,
        roleId: In(roleIds),
        isDeleted: false,
      },
    });
  }

  /**
   * 添加权限
   */
  async addPermission(data: {
    assetId: string;
    userId?: string;
    roleId?: string;
    permission: PermissionType;
  }): Promise<DataAssetPermissionEntity> {
    if (!data.userId && !data.roleId) {
      throw new Error('userId 或 roleId 必须提供其中之一');
    }

    const now = Date.now();
    const permission = this.create({
      id: nanoid(),
      ...data,
      createdTimestamp: now,
      updatedTimestamp: now,
      isDeleted: false,
    });

    return this.save(permission);
  }

  /**
   * 更新权限
   */
  async updatePermission(id: string, permission: PermissionType): Promise<void> {
    await this.update(
      { id, isDeleted: false },
      {
        permission,
        updatedTimestamp: Date.now(),
      }
    );
  }

  /**
   * 删除权限
   */
  async removePermission(id: string): Promise<void> {
    await this.update(
      { id, isDeleted: false },
      {
        isDeleted: true,
        updatedTimestamp: Date.now(),
      }
    );
  }

  /**
   * 批量删除资产的所有权限
   */
  async removeAllPermissions(assetId: string): Promise<void> {
    await this.update(
      { assetId, isDeleted: false },
      {
        isDeleted: true,
        updatedTimestamp: Date.now(),
      }
    );
  }
}
