import { AuthMethod } from '@/common/config';
import { UserRepository } from '@/database/repositories/user.repository';
import { Injectable } from '@nestjs/common';
import { JwtPayload } from 'jsonwebtoken';
import { JwtHelper } from '../jwt-utils';

@Injectable()
export class UsersService {
  constructor(private readonly userRepository: UserRepository) {}

  public async findById(userId: string) {
    return await this.userRepository.findById(userId);
  }

  public async updateUserInfo(userId: string, data: { name?: string; photo?: string }) {
    return await this.userRepository.updateUserInfo(userId, data);
  }

  public async registerByOidcIdToken(idToken: string) {
    const userinfo = JwtHelper.decodeJWTToken(idToken) as JwtPayload;
    if (!userinfo) {
      throw new Error('Invalid jwt token');
    }
    const { sub, name, nickname, picture, email, phone, phone_number, preferred_username } = userinfo;
    const user = await this.userRepository.registryOrGetUser({
      email,
      phone: phone || phone_number,
      photo: picture,
      name: nickname || name || preferred_username,
      externalId: sub,
    });
    await this.userRepository.updateUserLastLogin(user.id.toHexString(), AuthMethod.oidc);
    return user;
  }
}
