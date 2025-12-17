import { config } from '@/common/config';
import { generateDbId } from '@/common/utils';
import { UserEntity } from '@/database/entities/identity/user';
import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import crypto from 'crypto-js';
import { Brackets, Repository } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';
import {
  CreateUserDto,
  QueryUserListDto,
  UpdateUserDto,
  UserListResponseDto,
  UserManagementItemDto,
} from './dto/user-management.dto';

const DEFAULT_AVATAR = 'https://static.aside.fun/upload/frame/0XMWE1.jpg';

@Injectable()
export class UserManagementService {
  constructor(
    @InjectRepository(UserEntity)
    private readonly userRepository: Repository<UserEntity>,
  ) {}

  async listUsers(dto: QueryUserListDto): Promise<UserListResponseDto> {
    const page = Number(dto.page) || 1;
    const pageSize = Number(dto.pageSize) || 20;
    const keyword = dto.keyword?.trim();

    const qb = this.userRepository
      .createQueryBuilder('u')
      .where('u.isDeleted = :isDeleted', { isDeleted: false });

    if (keyword) {
      qb.andWhere(
        new Brackets((subQb) => {
          subQb
            .where('u.name LIKE :kw', { kw: `%${keyword}%` })
            .orWhere('u.email LIKE :kw', { kw: `%${keyword}%` })
            .orWhere('u.phone LIKE :kw', { kw: `%${keyword}%` })
            .orWhere('u.nickname LIKE :kw', { kw: `%${keyword}%` });
        }),
      );
    }

    const [list, total] = await qb
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

  async getUser(id: string): Promise<UserManagementItemDto> {
    const user = await this.userRepository.findOne({
      where: {
        id,
        isDeleted: false,
      },
    });
    if (!user) {
      throw new NotFoundException('用户不存在');
    }
    return this.toItemDto(user);
  }

  async createUser(dto: CreateUserDto): Promise<UserManagementItemDto> {
    const name = dto.name.trim();
    const email = dto.email.trim().toLowerCase();
    const password = dto.password;
    const phone = dto.phone?.trim();
    const nickname = dto.nickname?.trim();

    if (!name || !email || !password) {
      throw new BadRequestException('name/email/password 均为必填');
    }

    const existingByEmail = await this.userRepository.findOne({
      where: {
        email,
        isDeleted: false,
      },
    });
    if (existingByEmail) {
      throw new ConflictException('邮箱已存在');
    }

    const encryptedPassword = this.encryptPassword(password);
    const now = Date.now();

    const user = await this.userRepository.save({
      id: generateDbId(),
      name,
      email,
      phone,
      nickname,
      password: encryptedPassword,
      photo: DEFAULT_AVATAR,
      verified: dto.verified ?? false,
      isBlocked: dto.isBlocked ?? false,
      loginsCount: 0,
      createdTimestamp: now,
      updatedTimestamp: now,
      isDeleted: false,
      lastLoginAt: undefined,
      lastAuthMethod: undefined,
      externalId: undefined,
      isAdmin: false,
    } as UserEntity);

    return this.toItemDto(user);
  }

  async updateUser(id: string, dto: UpdateUserDto): Promise<UserManagementItemDto> {
    const user = await this.userRepository.findOne({
      where: {
        id,
        isDeleted: false,
      },
    });
    if (!user) {
      throw new NotFoundException('用户不存在');
    }

    if (dto.email !== undefined) {
      const email = dto.email.trim().toLowerCase();
      if (!email) {
        throw new BadRequestException('email 不能为空');
      }
      if (email !== user.email) {
        const existingByEmail = await this.userRepository.findOne({
          where: {
            email,
            isDeleted: false,
          },
        });
        if (existingByEmail && existingByEmail.id !== user.id) {
          throw new ConflictException('邮箱已存在');
        }
        user.email = email;
      }
    }

    if (dto.name !== undefined) {
      const name = dto.name.trim();
      if (!name) {
        throw new BadRequestException('name 不能为空');
      }
      user.name = name;
    }

    if (dto.phone !== undefined) {
      user.phone = dto.phone?.trim() || undefined;
    }

    if (dto.nickname !== undefined) {
      user.nickname = dto.nickname?.trim() || undefined;
    }

    if (dto.verified !== undefined) {
      user.verified = !!dto.verified;
    }

    if (dto.isBlocked !== undefined) {
      user.isBlocked = !!dto.isBlocked;
    }

    user.updatedTimestamp = Date.now();
    await this.userRepository.save(user);
    return this.toItemDto(user);
  }

  async deleteUser(id: string): Promise<void> {
    const user = await this.userRepository.findOne({
      where: {
        id,
        isDeleted: false,
      },
    });
    if (!user) {
      throw new NotFoundException('用户不存在');
    }
    user.isDeleted = true;
    user.updatedTimestamp = Date.now();
    await this.userRepository.save(user);
  }

  async resetPassword(id: string, password: string): Promise<void> {
    if (!password) {
      throw new BadRequestException('password 不能为空');
    }
    const user = await this.userRepository.findOne({
      where: {
        id,
        isDeleted: false,
      },
    });
    if (!user) {
      throw new NotFoundException('用户不存在');
    }
    user.password = this.encryptPassword(password);
    user.updatedTimestamp = Date.now();
    await this.userRepository.save(user);
  }

  private encryptPassword(password: string): string {
    const template = config.auth?.password?.saltTemplate;
    if (!template) {
      throw new Error('Password saltTemplate is not configured');
    }
    return crypto.MD5(template.replaceAll('{{password}}', password)).toString();
  }

  private toItemDto(user: UserEntity): UserManagementItemDto {
    return {
      id: user.id,
      name: user.name,
      email: user.email,
      phone: user.phone,
      nickname: user.nickname,
      photo: user.photo,
      verified: user.verified,
      isBlocked: user.isBlocked,
      lastLoginAt: user.lastLoginAt,
      loginsCount: user.loginsCount,
      createdTimestamp: user.createdTimestamp,
      updatedTimestamp: user.updatedTimestamp,
    };
  }
}

