import { AdminUserEntity } from '@/database/entities/admin/admin-user.entity';
import { AdminRoleRepository } from '@/database/repositories/admin-role.repository';
import { AdminUserRepository } from '@/database/repositories/admin-user.repository';
import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Brackets } from 'typeorm';
import * as bcrypt from 'bcrypt';
import {
  AdminUserListResponseDto,
  AdminUserManagementItemDto,
  CreateAdminUserDto,
  QueryAdminUserListDto,
  UpdateAdminUserDto,
} from './dto/admin-user-management.dto';

@Injectable()
export class AdminUserManagementService {
  constructor(
    private readonly adminUserRepository: AdminUserRepository,
    private readonly adminRoleRepository: AdminRoleRepository,
  ) {}

  async listAdmins(dto: QueryAdminUserListDto): Promise<AdminUserListResponseDto> {
    const page = Number(dto.page) || 1;
    const pageSize = Number(dto.pageSize) || 20;
    const keyword = dto.keyword?.trim();

    const qb = this.adminUserRepository
      .createQueryBuilder('u')
      .innerJoin('u.roles', 'r', 'r.code = :roleCode', { roleCode: 'admin' })
      .leftJoinAndSelect('u.roles', 'roles')
      .leftJoinAndSelect('roles.permissions', 'permissions')
      .where('u.isDeleted = :isDeleted', { isDeleted: false });

    if (keyword) {
      qb.andWhere(
        new Brackets((subQb) => {
          subQb
            .where('u.username LIKE :kw', { kw: `%${keyword}%` })
            .orWhere('u.name LIKE :kw', { kw: `%${keyword}%` })
            .orWhere('u.email LIKE :kw', { kw: `%${keyword}%` });
        }),
      );
    }

    const [list, total] = await qb
      .distinct(true)
      .orderBy('u.createdTimestamp', 'DESC')
      .skip((page - 1) * pageSize)
      .take(pageSize)
      .getManyAndCount();

    return {
      list: list.map((u) => this.toItemDto(u)),
      total,
      page,
      pageSize,
    };
  }

  async getAdmin(id: string): Promise<AdminUserManagementItemDto> {
    const user = await this.adminUserRepository.findById(id);
    if (!user) {
      throw new NotFoundException('管理员不存在');
    }
    if (this.isSuperAdmin(user)) {
      throw new ForbiddenException('不允许操作超级管理员');
    }
    return this.toItemDto(user);
  }

  async createAdmin(dto: CreateAdminUserDto, createdBy?: string): Promise<AdminUserManagementItemDto> {
    const username = dto.username.trim();
    const name = dto.name.trim();
    const email = dto.email.trim().toLowerCase();
    const password = dto.password;

    if (!username || !name || !email || !password) {
      throw new BadRequestException('username/name/email/password 均为必填');
    }

    const existingByUsername = await this.adminUserRepository.findByUsername(username);
    if (existingByUsername) {
      throw new ConflictException('用户名已存在');
    }

    const existingByEmail = await this.adminUserRepository.findByEmail(email);
    if (existingByEmail) {
      throw new ConflictException('邮箱已存在');
    }

    const adminRole = await this.adminRoleRepository.getAdminRole();
    if (!adminRole) {
      throw new Error('Admin role not found in database');
    }

    const user = await this.adminUserRepository.createAdminUser({
      username,
      password,
      name,
      email,
      roleIds: [adminRole.id],
      createdBy,
    });

    user.roles = [adminRole];
    user.isActive = true;
    await this.adminUserRepository.save(user);

    return this.toItemDto(user);
  }

  async updateAdmin(id: string, dto: UpdateAdminUserDto): Promise<AdminUserManagementItemDto> {
    const user = await this.adminUserRepository.findById(id);
    if (!user) {
      throw new NotFoundException('管理员不存在');
    }
    if (this.isSuperAdmin(user)) {
      throw new ForbiddenException('不允许操作超级管理员');
    }

    if (dto.username !== undefined) {
      const username = dto.username.trim();
      if (!username) {
        throw new BadRequestException('username 不能为空');
      }
      if (username !== user.username) {
        const existing = await this.adminUserRepository.findByUsername(username);
        if (existing && existing.id !== user.id) {
          throw new ConflictException('用户名已存在');
        }
        user.username = username;
      }
    }

    if (dto.name !== undefined) {
      const name = dto.name.trim();
      if (!name) {
        throw new BadRequestException('name 不能为空');
      }
      user.name = name;
    }

    if (dto.email !== undefined) {
      const email = dto.email.trim().toLowerCase();
      if (!email) {
        throw new BadRequestException('email 不能为空');
      }
      if (email !== user.email) {
        const existing = await this.adminUserRepository.findByEmail(email);
        if (existing && existing.id !== user.id) {
          throw new ConflictException('邮箱已存在');
        }
        user.email = email;
      }
    }

    if (dto.isActive !== undefined) {
      user.isActive = !!dto.isActive;
    }

    user.updatedTimestamp = Date.now();
    await this.adminUserRepository.save(user);
    return this.toItemDto(user);
  }

  async deleteAdmin(id: string): Promise<void> {
    const user = await this.adminUserRepository.findById(id);
    if (!user) {
      throw new NotFoundException('管理员不存在');
    }
    if (this.isSuperAdmin(user)) {
      throw new ForbiddenException('不允许删除超级管理员');
    }

    user.isDeleted = true;
    user.isActive = false;
    user.updatedTimestamp = Date.now();
    await this.adminUserRepository.save(user);
  }

  async resetPassword(id: string, password: string): Promise<void> {
    if (!password) {
      throw new BadRequestException('password 不能为空');
    }

    const user = await this.adminUserRepository.findById(id);
    if (!user) {
      throw new NotFoundException('管理员不存在');
    }
    if (this.isSuperAdmin(user)) {
      throw new ForbiddenException('不允许重置超级管理员密码');
    }

    user.password = await bcrypt.hash(password, 10);
    user.updatedTimestamp = Date.now();
    user.isActive = true;
    await this.adminUserRepository.save(user);
  }

  private isSuperAdmin(user: AdminUserEntity): boolean {
    return user.roles?.some((r) => r.code === 'super_admin') ?? false;
  }

  private toItemDto(user: AdminUserEntity): AdminUserManagementItemDto {
    const roles = (user.roles || []).map((r) => r.code);
    return {
      id: user.id,
      username: user.username,
      name: user.name,
      email: user.email || '',
      photo: user.photo,
      isActive: user.isActive,
      roles,
      lastLoginAt: user.lastLoginAt,
      loginsCount: user.loginsCount,
      createdTimestamp: user.createdTimestamp,
      updatedTimestamp: user.updatedTimestamp,
      createdBy: user.createdBy,
    };
  }
}
