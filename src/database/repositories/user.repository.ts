import { AuthMethod } from '@/common/config';
import { getMap } from '@/common/utils/map';
import { UserEntity } from '@/database/entities/identity/user';
import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import _ from 'lodash';
import { ObjectId } from 'mongodb';
import { In, Repository } from 'typeorm';

const defaultAvatar = 'https://static.aside.fun/upload/frame/0XMWE1.jpg';
export const OBJECT_ID_PATTERN = /[0-9][0-9a-z]{23}/;

export interface RegisterUserParams {
  name?: string;
  phone?: string;
  email?: string;
  password?: string;
  photo?: string;
  externalId?: string;
}

export interface RegisterOrUpdateUserParams {
  name?: string;
  phone?: string;
  email?: string;
  photo?: string;
  externalId?: string;
}

@Injectable()
export class UserRepository {
  constructor(
    @InjectRepository(UserEntity)
    private readonly userRepository: Repository<UserEntity>,
  ) {}

  public async findById(userId: string) {
    return await this.userRepository.findOne({
      where: {
        id: new ObjectId(userId),
        isDeleted: false,
      },
    });
  }

  public async findByIds(userIds: string[]) {
    return await this.userRepository.find({
      where: {
        id: In(userIds.map((x) => new ObjectId(x))),
        isDeleted: false,
      },
    });
  }

  public async findByEmail(email: string) {
    return await this.userRepository.findOne({
      where: {
        email,
        isDeleted: false,
      },
    });
  }

  public async updateUserLastLogin(userId: string, authMethod: AuthMethod) {
    const user = await this.findById(userId);
    if (user) {
      user.lastLoginAt = Date.now();
      user.loginsCount = (user.loginsCount || 0) + 1;
      user.lastAuthMethod = authMethod;
      await this.userRepository.save(user);
    }
  }

  public async registerUser(data: RegisterUserParams) {
    const { phone, email, name, password, photo, externalId } = data;
    const user = await this.userRepository.save({
      id: new ObjectId(),
      name: name || phone || email,
      phone,
      email,
      password,
      photo: photo || defaultAvatar,
      createdTimestamp: Date.now(),
      updatedTimestamp: Date.now(),
      lastLoginAt: Date.now(),
      isDeleted: false,
      isBlocked: false,
      externalId,
    });
    return user;
  }

  async registryOrGetUser(data: RegisterOrUpdateUserParams) {
    const { phone, email, externalId, photo, name } = data;
    if (!phone && !email && !externalId) {
      throw new Error('用户信息必须包含手机号、邮箱或者唯一 ID');
    }

    const userMatchByPhone = phone
      ? await this.userRepository.findOne({
          where: {
            phone,
            isDeleted: false,
          },
        })
      : null;
    const userMatchByEmail = email
      ? await this.userRepository.findOne({
          where: {
            email,
            isDeleted: false,
          },
        })
      : null;
    const userMatchByExternalId = externalId
      ? await this.userRepository.findOne({
          where: {
            externalId,
            isDeleted: false,
          },
        })
      : null;

    const matchCount = _.uniq([userMatchByEmail, userMatchByPhone, userMatchByExternalId].filter(Boolean).map((x) => x.id.toHexString())).length;
    if (matchCount === 0) {
      return this.registerUser(data);
    } else if (matchCount === 1) {
      const user = [userMatchByEmail, userMatchByPhone, userMatchByExternalId].filter(Boolean)[0];
      user.email = email;
      user.phone = phone;
      user.externalId = externalId;
      user.photo = photo;
      user.name = name;
      await this.userRepository.save(user);
      return user;
    } else {
      throw new Error('此 OIDC 用户通过邮箱、手机号、唯一 ID 匹配到了系统中的多个用户');
    }
  }

  async updateUserInfo(userId: string, data: { name?: string; photo?: string }) {
    const user = await this.findById(userId);
    if (!user) {
      throw new Error('用户不存在');
    }
    const { name, photo } = data;
    const updates: Partial<UserEntity> = {};
    if (name) updates.name = name;
    if (photo) updates.photo = photo;
    if (JSON.stringify(updates) === '{}') {
      throw new Error('暂无需要变更的资料');
    }
    await this.userRepository.update(
      {
        id: new ObjectId(userId),
      },
      updates,
    );
    return {
      success: true,
    };
  }

  public async getUsersByIdsAsMap(ids: string[]) {
    let userHash: Record<string, UserEntity> = {};
    if (ids?.length) {
      const users = await this.userRepository.find({
        where: {
          id: In(ids.map((x) => new ObjectId(x))),
          isDeleted: false,
        },
      });
      userHash = getMap(users, (u) => u.id.toHexString());
    }
    return userHash;
  }
}