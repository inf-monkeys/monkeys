import { CacheManager } from '@/common/cache';
import { CACHE_TOKEN } from '@/common/common.module';
import { AuthMethod, config } from '@/common/config';
import { UserRepository } from '@/database/repositories/user.repository';
import { JwtHelper } from '@/modules/auth/jwt-utils';
import { HttpService } from '@nestjs/axios';
import { Inject, Injectable } from '@nestjs/common';
import crypto from 'crypto-js';
import { omit } from 'lodash';
import { AgentType, WechatWorkBaseService } from 'nestjs-wechat-work';
import { lastValueFrom } from 'rxjs';

export enum AuthResultType {
  JWT = 'jwt',
  BIND_CODE = 'bind_code',
  ERROR = 'error',
}

@Injectable()
export class OAuthService {
  constructor(
    private readonly wechatWorkBaseService: WechatWorkBaseService,
    private readonly userRepository: UserRepository,
    private readonly httpService: HttpService,
    @Inject(CACHE_TOKEN) private readonly cache: CacheManager,
  ) {}

  private idToPassword(id: string) {
    return crypto.MD5(config.auth.wework.passwdSalt.replaceAll('{{id}}', id) + id).toString();
  }

  public async handleWeworkCallback(code: string, state: string) {
    try {
      const result = (await this.wechatWorkBaseService.getUserId(code)) as {
        UserId: string;
        DeviceId: string;
        errcode: number;
        errmsg: string;
        user_ticket: string;
        expires_in: number;
      };
      if ((result?.errcode || result?.errmsg) && result?.errcode !== 0) {
        throw new Error(`获取用户信息失败: ${result.errmsg}`);
      }

      const weworkUserId = result.UserId;
      if (!weworkUserId) {
        throw new Error('获取用户信息失败: 用户 ID 为空');
      }

      const saltUserId = crypto.MD5(weworkUserId).toString();

      const user = await this.userRepository.findByExternalId(saltUserId);

      if (user) {
        await this.userRepository.updateUserLastLogin(user.id, AuthMethod.oauth);
        return {
          type: AuthResultType.JWT,
          jwt: JwtHelper.signToken(omit(user, ['password'])),
        };
      } else {
        // 获取用户详情
        let userDetail: Record<string, any>;
        const userTicket = result.user_ticket;
        if (userTicket) {
          const accessToken = await this.wechatWorkBaseService.getAccessToken(AgentType.Custom);
          userDetail =
            (
              await lastValueFrom(
                this.httpService.post(`https://qyapi.weixin.qq.com/cgi-bin/auth/getuserdetail?access_token=${accessToken}`, {
                  user_ticket: userTicket,
                }),
              )
            )?.data ?? {};
        }

        // 自动注册为新账号
        if (state === 'create') {
          const newUser = await this.userRepository.registerUser({
            password: this.idToPassword(saltUserId),
            name: userDetail?.userid ?? weworkUserId,
            email: userDetail?.biz_mail ?? `${weworkUserId}@wework.tencent`,
            phone: userDetail?.mobile,
            photo: userDetail?.avatar,
            externalId: saltUserId,
          });
          return {
            type: AuthResultType.JWT,
            jwt: JwtHelper.signToken(omit(newUser, ['password'])),
          };
        }

        // 取8~24位 saltUserId 作为绑定码
        const bindCode = saltUserId.substring(8, 24);
        await this.cache.set(
          `${config.server.appId}:oauth-${bindCode}`,
          JSON.stringify({
            id: saltUserId,
            weworkUserId,
            data: userDetail,
          }),
          'EX',
          10 * 60,
        );

        return {
          type: AuthResultType.BIND_CODE,
          bindCode: bindCode,
        };
      }
    } catch (e) {
      return {
        type: AuthResultType.ERROR,
        message: e.message,
      };
    }
  }

  public async bindWework(code: string, userId: string) {
    const cacheKey = `${config.server.appId}:oauth-${code}`;
    const cache = await this.cache.get(cacheKey);
    if (!cache) {
      throw new Error('绑定码不存在');
    }

    try {
      const { id, data } = JSON.parse(cache);

      const user = await this.userRepository.findById(userId);
      if (!user) {
        throw new Error('用户不存在');
      }

      await this.userRepository.updateUser(user.id, {
        ...(!user?.email && data?.biz_mail ? { email: data?.biz_mail } : {}),
        ...(!user?.phone && data?.mobile ? { phone: data?.mobile } : {}),
        ...(!user?.photo && data?.avatar ? { photo: data?.avatar } : {}),
        externalId: id,
      });

      await this.cache.del(cacheKey);

      return '绑定成功';
    } catch {
      throw new Error('绑定失败，用户信息失效');
    }
  }

  public async unbindWework(userId: string) {
    const user = await this.userRepository.findById(userId);
    if (!user) {
      throw new Error('用户不存在');
    }

    await this.userRepository.updateUser(user.id, {
      externalId: null,
    });

    return '解绑成功';
  }
}
