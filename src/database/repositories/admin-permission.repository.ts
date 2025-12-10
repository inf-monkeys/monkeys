import { Injectable } from '@nestjs/common';
import { DataSource, Repository, In } from 'typeorm';
import { AdminPermissionEntity } from '@/database/entities/admin/admin-permission.entity';
import { nanoid } from 'nanoid';

@Injectable()
export class AdminPermissionRepository extends Repository<AdminPermissionEntity> {
  constructor(private dataSource: DataSource) {
    super(AdminPermissionEntity, dataSource.createEntityManager());
  }

  /**
   * 根据权限代码查找权限
   */
  async findByCode(code: string): Promise<AdminPermissionEntity | null> {
    return this.findOne({
      where: { code, isDeleted: false },
    });
  }

  /**
   * 根据权限代码列表查找权限
   */
  async findByCodes(codes: string[]): Promise<AdminPermissionEntity[]> {
    if (!codes || codes.length === 0) return [];
    return this.find({
      where: { code: In(codes), isDeleted: false },
    });
  }

  /**
   * 根据 ID 列表查找权限
   */
  async findByIds(ids: string[]): Promise<AdminPermissionEntity[]> {
    if (!ids || ids.length === 0) return [];
    return this.find({
      where: { id: In(ids), isDeleted: false },
    });
  }

  /**
   * 创建权限
   */
  async createPermission(data: {
    code: string;
    name: string;
    resource: string;
    action: string;
    description?: string;
  }): Promise<AdminPermissionEntity> {
    const permission = this.create({
      id: nanoid(),
      ...data,
      createdTimestamp: Date.now(),
      updatedTimestamp: Date.now(),
      isDeleted: false,
    });

    await this.save(permission);
    return permission;
  }

  /**
   * 批量创建权限
   */
  async bulkCreate(
    permissions: Array<{
      code: string;
      name: string;
      resource: string;
      action: string;
      description?: string;
    }>
  ): Promise<AdminPermissionEntity[]> {
    const entities = permissions.map((perm) =>
      this.create({
        id: nanoid(),
        ...perm,
        createdTimestamp: Date.now(),
        updatedTimestamp: Date.now(),
        isDeleted: false,
      })
    );

    return this.save(entities);
  }

  /**
   * 获取所有权限
   */
  async findAll(): Promise<AdminPermissionEntity[]> {
    return this.find({
      where: { isDeleted: false },
      order: { resource: 'ASC', action: 'ASC' },
    });
  }

  /**
   * 根据资源类型获取权限
   */
  async findByResource(resource: string): Promise<AdminPermissionEntity[]> {
    return this.find({
      where: { resource, isDeleted: false },
      order: { action: 'ASC' },
    });
  }
}
