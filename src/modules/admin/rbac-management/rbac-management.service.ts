import { AdminPermissionEntity } from '@/database/entities/admin/admin-permission.entity';
import { AdminRoleEntity } from '@/database/entities/admin/admin-role.entity';
import { AdminPermissionRepository } from '@/database/repositories/admin-permission.repository';
import { AdminRoleRepository } from '@/database/repositories/admin-role.repository';
import { AdminUserRepository } from '@/database/repositories/admin-user.repository';
import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { nanoid } from 'nanoid';
import {
  AdminPermissionItemDto,
  AdminRoleItemDto,
  CreateAdminRoleDto,
  SetRolePermissionsDto,
  UpdateAdminRoleDto,
} from './dto/rbac-management.dto';

const RESERVED_ROLE_CODES = new Set(['super_admin', 'admin']);

@Injectable()
export class RbacManagementService {
  constructor(
    private readonly adminRoleRepository: AdminRoleRepository,
    private readonly adminPermissionRepository: AdminPermissionRepository,
    private readonly adminUserRepository: AdminUserRepository,
  ) {}

  async listPermissions(): Promise<AdminPermissionItemDto[]> {
    const permissions = await this.adminPermissionRepository.findAll();
    return permissions.map((p) => this.toPermissionDto(p));
  }

  async listRoles(): Promise<AdminRoleItemDto[]> {
    const roles = await this.adminRoleRepository.findAll();
    return roles
      .filter((r) => r.code !== 'super_admin')
      .map((r) => this.toRoleDto(r));
  }

  async getRole(id: string): Promise<AdminRoleItemDto> {
    const role = await this.adminRoleRepository.findOne({
      where: { id, isDeleted: false },
      relations: ['permissions'],
    });
    if (!role || role.code === 'super_admin') {
      throw new NotFoundException('角色不存在');
    }
    return this.toRoleDto(role);
  }

  async createRole(dto: CreateAdminRoleDto): Promise<AdminRoleItemDto> {
    const code = this.normalizeRoleCode(dto.code);
    const name = dto.name?.trim();
    const description = dto.description?.trim();

    if (!code || !name) {
      throw new BadRequestException('code/name 均为必填');
    }

    if (RESERVED_ROLE_CODES.has(code)) {
      throw new BadRequestException('该角色 code 为系统保留，无法创建');
    }

    const existing = await this.adminRoleRepository.findByCode(code);
    if (existing) {
      throw new ConflictException('角色 code 已存在');
    }

    const role = this.adminRoleRepository.create({
      id: nanoid(),
      code,
      name,
      description,
      isSystem: false,
      createdTimestamp: Date.now(),
      updatedTimestamp: Date.now(),
      isDeleted: false,
    });

    await this.adminRoleRepository.save(role);

    const saved = await this.adminRoleRepository.findOne({
      where: { id: role.id, isDeleted: false },
      relations: ['permissions'],
    });
    if (!saved) {
      throw new Error('Failed to load created role');
    }
    return this.toRoleDto(saved);
  }

  async updateRole(id: string, dto: UpdateAdminRoleDto): Promise<AdminRoleItemDto> {
    const role = await this.adminRoleRepository.findOne({
      where: { id, isDeleted: false },
      relations: ['permissions'],
    });
    if (!role || role.code === 'super_admin') {
      throw new NotFoundException('角色不存在');
    }

    if (dto.code !== undefined) {
      const code = this.normalizeRoleCode(dto.code);
      if (!code) {
        throw new BadRequestException('code 不能为空');
      }
      if (code !== role.code) {
        if (role.isSystem) {
          throw new ForbiddenException('系统角色不允许修改 code');
        }
        if (RESERVED_ROLE_CODES.has(code)) {
          throw new BadRequestException('该角色 code 为系统保留，无法使用');
        }
        const existing = await this.adminRoleRepository.findByCode(code);
        if (existing && existing.id !== role.id) {
          throw new ConflictException('角色 code 已存在');
        }
        role.code = code;
      }
    }

    if (dto.name !== undefined) {
      const name = dto.name.trim();
      if (!name) {
        throw new BadRequestException('name 不能为空');
      }
      role.name = name;
    }

    if (dto.description !== undefined) {
      const description = dto.description?.trim();
      role.description = description || null;
    }

    role.updatedTimestamp = Date.now();
    await this.adminRoleRepository.save(role);
    return this.toRoleDto(role);
  }

  async deleteRole(id: string): Promise<void> {
    const role = await this.adminRoleRepository.findOne({
      where: { id, isDeleted: false },
    });
    if (!role || role.code === 'super_admin') {
      throw new NotFoundException('角色不存在');
    }
    if (role.isSystem) {
      throw new ForbiddenException('系统角色不可删除');
    }

    const userCount = await this.adminUserRepository
      .createQueryBuilder('u')
      .innerJoin('u.roles', 'r', 'r.id = :roleId', { roleId: role.id })
      .where('u.isDeleted = :isDeleted', { isDeleted: false })
      .getCount();

    if (userCount > 0) {
      throw new ConflictException('角色已被使用，无法删除');
    }

    role.isDeleted = true;
    role.updatedTimestamp = Date.now();
    await this.adminRoleRepository.save(role);
  }

  async setRolePermissions(id: string, dto: SetRolePermissionsDto): Promise<AdminRoleItemDto> {
    const role = await this.adminRoleRepository.findOne({
      where: { id, isDeleted: false },
      relations: ['permissions'],
    });
    if (!role || role.code === 'super_admin') {
      throw new NotFoundException('角色不存在');
    }

    const permissionIds = Array.from(
      new Set((dto.permissionIds || []).map((v) => String(v).trim()).filter(Boolean)),
    );

    const permissions = await this.adminPermissionRepository.findByIds(permissionIds);
    if (permissions.length !== permissionIds.length) {
      const found = new Set(permissions.map((p) => p.id));
      const missing = permissionIds.filter((id) => !found.has(id));
      throw new BadRequestException(`部分权限不存在: ${missing.join(', ')}`);
    }

    role.permissions = permissions;
    role.updatedTimestamp = Date.now();
    await this.adminRoleRepository.save(role);
    return this.toRoleDto(role);
  }

  private normalizeRoleCode(code: string): string {
    return String(code || '').trim().toLowerCase();
  }

  private toPermissionDto(permission: AdminPermissionEntity): AdminPermissionItemDto {
    return {
      id: permission.id,
      code: permission.code,
      name: permission.name,
      resource: permission.resource,
      action: permission.action,
      description: permission.description,
      createdTimestamp: permission.createdTimestamp,
      updatedTimestamp: permission.updatedTimestamp,
    };
  }

  private toRoleDto(role: AdminRoleEntity): AdminRoleItemDto {
    return {
      id: role.id,
      code: role.code,
      name: role.name,
      description: role.description,
      isSystem: !!role.isSystem,
      permissions: (role.permissions || []).map((p) => this.toPermissionDto(p)),
      createdTimestamp: role.createdTimestamp,
      updatedTimestamp: role.updatedTimestamp,
    };
  }
}

