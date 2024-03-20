import { UserEntity } from '@/entities/identity/user';
import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { pickBy } from 'lodash';
import { ObjectId } from 'mongodb';
import { Repository } from 'typeorm';

const defaultAvatar = 'https://static.aside.fun/upload/frame/0XMWE1.jpg';
export const OBJECT_ID_PATTERN = /[0-9][0-9a-z]{23}/;

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

  public async findByEmail(email: string) {
    return await this.userRepository.findOne({
      where: {
        email,
        isDeleted: false,
      },
    });
  }

  public async updateUserLastLogin(userId: string) {
    const user = await this.findById(userId);
    if (user) {
      user.lastLoginAt = Date.now();
      user.loginsCount = (user.lastLoginAt || 0) + 1;
      await this.userRepository.save(user);
    }
  }

  public async registerUser(data: { phone?: string; email?: string; password?: string }) {
    const { phone, email, password } = data;
    const newUser: UserEntity = {
      id: new ObjectId(),
      name: phone || email,
      phone,
      email,
      password,
      photo: defaultAvatar,
      createdTimestamp: Date.now(),
      updatedTimestamp: Date.now(),
      lastLoginAt: Date.now(),
      isDeleted: false,
      isBlocked: false,
    };
    await this.userRepository.save(newUser);
    return newUser;
  }

  async registryOrGetUser(data: { phone?: string; email?: string; password?: string }) {
    const { phone, email } = data;
    if (!phone && !email) return null;
    const user = await this.userRepository.findOne({
      where: {
        ...pickBy({ phone, email }, (v) => typeof v !== 'undefined'),
        isDeleted: false,
      },
    });
    if (user) {
      await this.updateUserLastLogin(user.id.toHexString());
      return user;
    }
    return this.registerUser(data);
  }
}
