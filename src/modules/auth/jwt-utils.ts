import { config } from '@/common/config';
import { UserEntity } from '@/entities/identity/user';
import { ForbiddenException } from '@nestjs/common';
import * as jwt from 'jsonwebtoken';

export class JwtHelper {
  public static validateToken(opt: { idToken: string }): { sub: string } {
    if (!opt?.idToken) {
      throw new ForbiddenException('请先登录');
    }
    return jwt.verify(opt.idToken, config.auth.jwt.secret) as { sub: string };
  }

  public static signToken(user: UserEntity, expiresIn = config.auth.jwt.expires_in) {
    return jwt.sign(
      {
        sub: user.id.toHexString(),
      },
      config.auth.jwt.secret,
      { expiresIn },
    );
  }
}
