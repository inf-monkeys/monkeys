import { config } from '@/common/config';
import { AdminUserEntity } from '@/database/entities/admin/admin-user.entity';
import { AdminRoleRepository } from '@/database/repositories/admin-role.repository';
import { AdminUserRepository } from '@/database/repositories/admin-user.repository';
import { Injectable, UnauthorizedException } from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import * as jwt from 'jsonwebtoken';
import { AdminLoginDto } from './dto/admin-login.dto';
import {
  AdminLoginResponseDto,
  AdminUserDto,
  SuperAdminInitResponseDto,
} from './dto/admin-user.dto';

@Injectable()
export class AdminAuthService {
  constructor(
    private readonly adminUserRepository: AdminUserRepository,
    private readonly adminRoleRepository: AdminRoleRepository,
  ) {}

  /**
   * 初始化 SuperAdmin
   * 如果已存在，返回已存在信息
   * 如果不存在，创建新的 SuperAdmin 并返回随机密码
   */
  async initSuperAdmin(): Promise<SuperAdminInitResponseDto> {
    // 检查是否已存在 SuperAdmin
    const existingSuperAdmin = await this.adminUserRepository.findSuperAdmin();

    // 获取 SuperAdmin 角色
    const superAdminRole = await this.adminRoleRepository.getSuperAdminRole();
    if (!superAdminRole) {
      throw new Error('SuperAdmin role not found in database');
    }

    // 生成随机密码
    const randomPassword = this.generateRandomPassword();

    const username = 'SuperAdmin';
    const name = '超级管理员';
    const email = `superadmin@${config.server.host}`;

    if (existingSuperAdmin) {
      // 重置密码
      const hashedPassword = await bcrypt.hash(randomPassword, 10);
      existingSuperAdmin.password = hashedPassword;
      existingSuperAdmin.updatedTimestamp = Date.now();
      existingSuperAdmin.isActive = true;
      await this.adminUserRepository.save(existingSuperAdmin);

      return {
        created: false,
        username,
        password: randomPassword,
        role: 'super_admin',
        email,
        message: 'SuperAdmin password has been reset. Please save the new password.',
      };
    }

    // 创建 SuperAdmin 用户（使用固定值）
    const user = await this.adminUserRepository.createAdminUser({
      username,
      password: randomPassword,
      name,
      email,
      roleIds: [superAdminRole.id],
    });

    // 关联角色
    user.roles = [superAdminRole];
    await this.adminUserRepository.save(user);

    return {
      created: true,
      username,
      password: randomPassword,
      role: 'super_admin',
      email,
      message: 'SuperAdmin created successfully. Please save the password.',
    };
  }

  /**
   * 管理员登录
   */
  async login(loginDto: AdminLoginDto): Promise<AdminLoginResponseDto> {
    const { email, password } = loginDto;

    // 查找用户
    const user = await this.adminUserRepository.findByEmail(email);
    if (!user) {
      throw new UnauthorizedException('Invalid email or password');
    }

    // 验证密码
    const isPasswordValid = await this.adminUserRepository.validatePassword(
      password,
      user.password,
    );
    if (!isPasswordValid) {
      throw new UnauthorizedException('Invalid email or password');
    }

    // 检查用户是否激活
    if (!user.isActive) {
      throw new UnauthorizedException('User account is deactivated');
    }

    // 更新最后登录时间
    await this.adminUserRepository.updateLastLogin(user.id);

    // 生成 JWT
    const token = this.generateToken(user);

    // 转换为 DTO
    const userDto = this.transformToDto(user);

    return {
      token,
      user: userDto,
    };
  }

  /**
   * 验证 JWT Token 并返回用户信息
   */
  async validateToken(token: string): Promise<AdminUserDto> {
    try {
      const secret = config.admin?.jwt?.secret || 'monkeys-admin';
      const payload: any = jwt.verify(token, secret);
      const user = await this.adminUserRepository.findById(payload.sub);

      if (!user || !user.isActive) {
        throw new UnauthorizedException('Invalid token');
      }

      return this.transformToDto(user);
    } catch (error) {
      throw new UnauthorizedException('Invalid token');
    }
  }

  /**
   * 根据用户 ID 获取用户信息
   */
  async getUserById(userId: string): Promise<AdminUserDto> {
    const user = await this.adminUserRepository.findById(userId);
    if (!user) {
      throw new UnauthorizedException('User not found');
    }
    return this.transformToDto(user);
  }

  /**
   * 生成 JWT Token
   */
  private generateToken(user: AdminUserEntity): string {
    const payload = {
      sub: user.id,
      username: user.username,
      roles: user.roles.map((r) => r.code),
    };

    const secret = config.admin?.jwt?.secret || 'monkeys-admin';
    const expiresIn = config.admin?.jwt?.expiresIn || '7d';

    return jwt.sign(payload, secret, { expiresIn });
  }

  /**
   * 转换 Entity 为 DTO
   */
  private transformToDto(user: AdminUserEntity): AdminUserDto {
    // 聚合所有权限（从所有角色中）
    const permissionsSet = new Set<string>();
    const rolesArray: string[] = [];

    user.roles.forEach((role) => {
      rolesArray.push(role.code);
      role.permissions.forEach((permission) => {
        permissionsSet.add(permission.code);
      });
    });

    // 检查是否为 SuperAdmin
    const isSuperAdmin = rolesArray.includes('super_admin');

    return {
      id: user.id,
      username: user.username,
      name: user.name,
      email: user.email,
      photo: user.photo,
      roles: rolesArray,
      permissions: Array.from(permissionsSet),
      isAdmin: true,
      isSuperAdmin,
      lastLoginAt: user.lastLoginAt,
      loginsCount: user.loginsCount,
    };
  }

  /**
   * 生成随机密码
   */
  private generateRandomPassword(): string {
    const length = 16;
    const charset =
      'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*';
    let password = '';

    // 确保至少包含一个大写字母、小写字母、数字和特殊字符
    password += 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'[Math.floor(Math.random() * 26)];
    password += 'abcdefghijklmnopqrstuvwxyz'[Math.floor(Math.random() * 26)];
    password += '0123456789'[Math.floor(Math.random() * 10)];
    password += '!@#$%^&*'[Math.floor(Math.random() * 8)];

    // 生成剩余字符
    for (let i = password.length; i < length; i++) {
      password += charset[Math.floor(Math.random() * charset.length)];
    }

    // 打乱顺序
    return password
      .split('')
      .sort(() => Math.random() - 0.5)
      .join('');
  }
}
