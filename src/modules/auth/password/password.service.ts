import { AuthMethod, config } from '@/common/config';
import { UserRepository } from '@/database/repositories/user.repository';
import { ForbiddenException, Injectable } from '@nestjs/common';
import crypto from 'crypto-js';
import { omit } from 'lodash';
import { JwtHelper } from '../jwt-utils';

@Injectable()
export class PasswordService {
  constructor(private readonly userRepository: UserRepository) {}

  public encryptPassword(password: string) {
    return crypto.MD5(config.auth.password.saltTemplate.replaceAll('{{password}}', password)).toString();
  }

  public validatePassword(password: string, encryptedPassword: string) {
    return encryptedPassword === this.encryptPassword(password);
  }

  async loginByPassword(email: string, password: string) {
    let user = await this.userRepository.findByEmail(email);
    if (user) {
      const verifyRes = await this.validatePassword(password, user.password);
      if (!verifyRes) {
        throw new ForbiddenException('密码错误或用户不存在，请检查');
      }
      // 验证通过
      await this.userRepository.updateUserLastLogin(user.id.toHexString(), AuthMethod.password);
    } else {
      // 注册
      const PASSWORD_REG = /^(?=.*[a-zA-Z])(?=.*\d).{8,32}$/;
      if (!PASSWORD_REG.test(password)) {
        throw new ForbiddenException('密码须包含大小写字母与数字，长度不少于 8 位');
      }
      const encryptedPassword = this.encryptPassword(password);
      user = await this.userRepository.registerUser({ email, password: encryptedPassword });
    }
    user = omit(user, ['password']);
    return JwtHelper.signToken(user);
  }
}
