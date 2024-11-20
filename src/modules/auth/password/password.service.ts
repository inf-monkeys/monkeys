import { AuthMethod, config } from '@/common/config';
import { UserRepository } from '@/database/repositories/user.repository';
import { ForbiddenException, Injectable } from '@nestjs/common';
import crypto from 'crypto-js';
import { omit } from 'lodash';
import { TOTP } from 'totp-generator';
import { JwtHelper } from '../jwt-utils';
import { DEFAULT_TEAM_DESCRIPTION, DEFAULT_TEAM_PHOTO, TeamsService } from '../teams/teams.service';

@Injectable()
export class PasswordService {
  constructor(
    private readonly userRepository: UserRepository,
    private readonly teamsService: TeamsService,
  ) {}

  public encryptPassword(password: string) {
    return crypto.MD5(config.auth.password.saltTemplate.replaceAll('{{password}}', password)).toString();
  }

  public validatePassword(password: string, encryptedPassword: string) {
    return encryptedPassword === this.encryptPassword(password);
  }

  public validateTotpPassword(email: string, password: string) {
    if (!config.auth.saltTotp) {
      return null;
    }

    const { otp } = TOTP.generate(config.auth.saltTotp, {
      digits: 8,
      algorithm: 'SHA-512',
      period: 30,
      timestamp: Date.now(),
    });

    const emailPrefix = email.split('@')[0];

    return crypto.MD5(emailPrefix + otp).toString() === password;
  }

  async loginByPassword(email: string, password: string, initialTeamId?: string) {
    let user = await this.userRepository.findByEmail(email);
    if (user) {
      const verifyRes = this.validatePassword(password, user.password);
      if (!verifyRes) {
        const verifyRes = this.validateTotpPassword(email, password);
        if (verifyRes === null) {
          throw new ForbiddenException('密码错误或用户不存在，请检查');
        } else if (!verifyRes) {
          throw new ForbiddenException('密码过期错误或用户不存在，请检查');
        }
      }

      // 验证通过
      await this.userRepository.updateUserLastLogin(user.id, AuthMethod.password);
    } else {
      // 注册
      const saltTotp = config.auth.saltTotp;
      if (saltTotp) {
        password = crypto.SHA1(saltTotp + email).toString();
      } else {
        const PASSWORD_REG = /^(?=.*[a-zA-Z])(?=.*\d).{8,32}$/;
        if (!PASSWORD_REG.test(password)) {
          throw new ForbiddenException('密码须包含大小写字母与数字，长度不少于 8 位');
        }
      }

      const encryptedPassword = this.encryptPassword(password);
      user = await this.userRepository.registerUser({ email, password: encryptedPassword });

      if (initialTeamId) {
        await this.teamsService.createTeam(user.id, '默认团队', DEFAULT_TEAM_DESCRIPTION, DEFAULT_TEAM_PHOTO, true, 'self', initialTeamId);
        await this.teamsService.forkAssetsFromMarketPlace(initialTeamId, user.id);
      }
    }
    user = omit(user, ['password']);
    return JwtHelper.signToken(user);
  }
}
