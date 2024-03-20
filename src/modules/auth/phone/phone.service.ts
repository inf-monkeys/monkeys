import { CacheManager } from '@/common/cache';
import { config } from '@/common/config';
import { sendSms } from '@/common/utils/sms';
import { getRandomNumber } from '@/common/utils/utils';
import { UserRepository } from '@/repositories/user.repository';
import { ForbiddenException, Inject, Injectable } from '@nestjs/common';
import { omit } from 'lodash';
import { JwtHelper } from '../jwt-utils';

@Injectable()
export class PhoneService {
  constructor(
    @Inject('CACHE') private readonly cacheManager: CacheManager,
    private readonly userRepository: UserRepository,
  ) {}

  async verifyPhoneCode(phoneNumber: string, verifyCode: number): Promise<boolean> {
    const code = await this.cacheManager.get(`${config.server.appId}:p-v-c-${phoneNumber}`);
    return code && String(code) === String(verifyCode);
  }

  async loginByPhoneNumber(phoneNumber: string, verifyCode: number) {
    const verifyRes = await this.verifyPhoneCode(phoneNumber, verifyCode);
    if (!verifyRes) {
      throw new ForbiddenException('验证失败，验证码有误');
    }
    // 验证通过
    let user = await this.userRepository.registryOrGetUser({ phone: phoneNumber });
    user = omit(user, ['password']);
    if (user) {
      if (user.isBlocked) {
        throw new ForbiddenException('用户已被禁用, 请联系客服处理');
      }
      return JwtHelper.signToken(user);
    }
  }

  async sendPhoneNumberVerifyCode(phoneNumber: string) {
    const verifyCode = getRandomNumber(100000, 999999);
    await this.cacheManager.set(`${config.server.appId}:p-v-c-${phoneNumber}`, verifyCode, 'EX', 5 * 60);
    await sendSms(phoneNumber, verifyCode);
    return true;
  }
}
