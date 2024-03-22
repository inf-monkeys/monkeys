import { config } from '@/common/config';
import { UserEntity } from '@/entities/identity/user';
import { ForbiddenException } from '@nestjs/common';
import * as jwt from 'jsonwebtoken';

export interface UserPayload {
  id: string;
  name: string;
  photo: string;
  nickname?: string;
  phone?: string;
  email?: string;
}

export class JwtHelper {
  public static validateToken(opt: { idToken: string }): UserPayload {
    if (!opt?.idToken) {
      throw new ForbiddenException('请先登录');
    }
    return jwt.verify(opt.idToken, config.auth.jwt.secret) as UserPayload;
  }

  public static signToken(user: UserEntity, expiresIn = config.auth.jwt.expires_in) {
    const payload: UserPayload = {
      id: user.id.toHexString(),
      name: user.name,
      photo: user.photo,
      nickname: user.nickname,
      phone: user.phone,
      email: user.email,
    };
    return jwt.sign(payload, config.auth.jwt.secret, { expiresIn });
  }

  public static decodeJWTToken(token: string) {
    try {
      // 解码JWT，不验证签名
      const decoded = jwt.decode(token);
      return decoded;
    } catch (error) {
      // 处理解码过程中可能发生的错误
      console.error('Error decoding JWT:', error.message);
      return null;
    }
  }
}
