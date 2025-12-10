import { AdminUserEntity } from '@/database/entities/admin/admin-user.entity';
import { Injectable } from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { nanoid } from 'nanoid';
import { DataSource, Repository } from 'typeorm';

@Injectable()
export class AdminUserRepository extends Repository<AdminUserEntity> {
  constructor(private dataSource: DataSource) {
    super(AdminUserEntity, dataSource.createEntityManager());
  }

  /**
   * 根据用户名查找管理员
   */
  async findByUsername(username: string): Promise<AdminUserEntity | null> {
    return this.findOne({
      where: { username, isDeleted: false },
      relations: ['roles', 'roles.permissions'],
    });
  }

  /**
   * 根据邮箱查找管理员
   */
  async findByEmail(email: string): Promise<AdminUserEntity | null> {
    return this.findOne({
      where: { email, isDeleted: false },
      relations: ['roles', 'roles.permissions'],
    });
  }

  /**
   * 根据 ID 查找管理员
   */
  async findById(id: string): Promise<AdminUserEntity | null> {
    return this.findOne({
      where: { id, isDeleted: false },
      relations: ['roles', 'roles.permissions'],
    });
  }

  /**
   * 创建管理员用户
   */
  async createAdminUser(data: {
    username: string;
    password: string;
    name: string;
    email?: string;
    roleIds: string[];
    createdBy?: string;
  }): Promise<AdminUserEntity> {
    const { password, roleIds, ...userData } = data;

    // 加密密码
    const hashedPassword = await bcrypt.hash(password, 10);

    // 创建用户
    const user = this.create({
      id: nanoid(),
      ...userData,
      password: hashedPassword,
      createdTimestamp: Date.now(),
      updatedTimestamp: Date.now(),
      isDeleted: false,
    });

    // 关联角色（后续在 service 层处理）
    await this.save(user);

    return user;
  }

  /**
   * 验证密码
   */
  async validatePassword(
    plainPassword: string,
    hashedPassword: string
  ): Promise<boolean> {
    return bcrypt.compare(plainPassword, hashedPassword);
  }

  /**
   * 更新最后登录时间
   */
  async updateLastLogin(userId: string): Promise<void> {
    await this.update(userId, {
      lastLoginAt: Date.now(),
      loginsCount: () => 'logins_count + 1',
    });
  }

  /**
   * 检查是否存在 SuperAdmin
   */
  async hasSuperAdmin(): Promise<boolean> {
    const count = await this.count({
      where: {
        isDeleted: false,
        roles: {
          code: 'super_admin',
        },
      },
    });
    return count > 0;
  }

  /**
   * 获取 SuperAdmin 用户（若存在）
   */
  async findSuperAdmin(): Promise<AdminUserEntity | null> {
    return this.findOne({
      where: {
        isDeleted: false,
        roles: {
          code: 'super_admin',
        },
      },
      relations: ['roles', 'roles.permissions'],
    });
  }

  /**
   * 获取所有活跃的管理员
   */
  async findAllActive(): Promise<AdminUserEntity[]> {
    return this.find({
      where: { isDeleted: false, isActive: true },
      relations: ['roles'],
      order: { createdTimestamp: 'DESC' },
    });
  }
}
