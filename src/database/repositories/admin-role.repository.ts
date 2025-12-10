import { Injectable } from '@nestjs/common';
import { DataSource, Repository } from 'typeorm';
import { AdminRoleEntity } from '@/database/entities/admin/admin-role.entity';
import { nanoid } from 'nanoid';

@Injectable()
export class AdminRoleRepository extends Repository<AdminRoleEntity> {
  constructor(private dataSource: DataSource) {
    super(AdminRoleEntity, dataSource.createEntityManager());
  }

  /**
   * 根据角色代码查找角色
   */
  async findByCode(code: string): Promise<AdminRoleEntity | null> {
    return this.findOne({
      where: { code, isDeleted: false },
      relations: ['permissions'],
    });
  }

  /**
   * 根据 ID 列表查找角色
   */
  async findByIds(ids: string[]): Promise<AdminRoleEntity[]> {
    if (!ids || ids.length === 0) return [];
    return this.find({
      where: ids.map((id) => ({ id, isDeleted: false })),
      relations: ['permissions'],
    });
  }

  /**
   * 创建角色
   */
  async createRole(data: {
    code: string;
    name: string;
    description?: string;
    isSystem?: boolean;
    permissionIds?: string[];
  }): Promise<AdminRoleEntity> {
    const role = this.create({
      id: nanoid(),
      ...data,
      createdTimestamp: Date.now(),
      updatedTimestamp: Date.now(),
      isDeleted: false,
    });

    await this.save(role);
    return role;
  }

  /**
   * 获取所有角色
   */
  async findAll(): Promise<AdminRoleEntity[]> {
    return this.find({
      where: { isDeleted: false },
      relations: ['permissions'],
      order: { createdTimestamp: 'DESC' },
    });
  }

  /**
   * 获取 SuperAdmin 角色
   */
  async getSuperAdminRole(): Promise<AdminRoleEntity | null> {
    return this.findByCode('super_admin');
  }

  /**
   * 获取普通 Admin 角色
   */
  async getAdminRole(): Promise<AdminRoleEntity | null> {
    return this.findByCode('admin');
  }
}
