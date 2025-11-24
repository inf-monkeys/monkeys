import { CacheManager } from '@/common/cache';
import { CACHE_TOKEN } from '@/common/common.module';
import { AuthMethod, config } from '@/common/config';
import { UserRepository } from '@/database/repositories/user.repository';
import { JwtHelper } from '@/modules/auth/jwt-utils';
import { HttpService } from '@nestjs/axios';
import { Inject, Injectable } from '@nestjs/common';
import axios from 'axios';
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

      const user = await this.userRepository.findByExternalId(`wework:${saltUserId}`);

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
            externalId: `wework:${saltUserId}`,
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
        externalId: `wework:${id}`,
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

    if (!user.externalId?.startsWith('wework:')) {
      throw new Error('用户未绑定企业微信');
    }

    await this.userRepository.updateUser(user.id, {
      externalId: null,
    });

    return '解绑成功';
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  public async handleFeishuCallback(code: string, state: string) {
    const tokenApi = `${config.auth.feishu.feishuApiUrl}/open-apis/authen/v2/oauth/token`;
    const { data: tokenData } = await axios.post(tokenApi, {
      grant_type: 'authorization_code',
      client_id: config.auth.feishu.appId,
      client_secret: config.auth.feishu.appSecret,
      code,
      redirect_uri: `${config.server.appUrl}/api/auth/oauth/feishu/callback`,
    });
    const { access_token } = tokenData;
    const userInfoApi = `${config.auth.feishu.feishuApiUrl}/open-apis/authen/v1/user_info`;
    const { data: userInfoData } = await axios.get(userInfoApi, {
      headers: {
        Authorization: `Bearer ${access_token}`,
      },
    });
    if (userInfoData.code !== 0) {
      throw new Error(userInfoData.msg);
    }
    const { avatar_url, email: originalEmail, mobile: originalMobile, enterprise_email, name, user_id } = userInfoData.data;
    const email = enterprise_email || originalEmail;
    let mobile = originalMobile;
    if (mobile) {
      mobile = mobile.replace(/^(\+86|86)/, '');
    }
    const user = await this.userRepository.registryOrGetUser({
      email,
      phone: mobile,
      photo: avatar_url,
      name,
      externalId: `feishu:${user_id}`,
    });
    await this.userRepository.updateUserLastLogin(user.id, AuthMethod.oauth);
    const jwtToken = JwtHelper.signToken(user);
    return jwtToken;
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  public async handleDingtalkCallback(code: string, state: string) {
    if (!config.auth.dingtalk?.appId || !config.auth.dingtalk?.appSecret) {
      throw new Error('未配置钉钉应用信息');
    }
    const authCode = code || state; // 钉钉可能回传 authCode 或 code，二者值相同
    const apiBaseUrl = config.auth.dingtalk.apiBaseUrl || 'https://api.dingtalk.com';
    const tokenApi = `${apiBaseUrl}/v1.0/oauth2/userAccessToken`;
    const { data: tokenData } = await axios.post(tokenApi, {
      clientId: config.auth.dingtalk.appId,
      clientSecret: config.auth.dingtalk.appSecret,
      code: authCode,
      grantType: 'authorization_code',
    });

    const accessToken = tokenData?.accessToken;
    if (!accessToken) {
      throw new Error(tokenData?.message || '获取钉钉访问凭证失败');
    }

    const userInfoApi = `${apiBaseUrl}/v1.0/contact/users/me`;
    const { data: userInfoData } = await axios.get(userInfoApi, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'x-acs-dingtalk-access-token': accessToken,
      },
    });

    const externalId = userInfoData?.unionId || userInfoData?.openId;
    if (!externalId) {
      throw new Error('未能获取钉钉用户标识');
    }
    const normalizedMobile = userInfoData?.mobile ? userInfoData.mobile.replace(/^(\+?86)/, '') : undefined;

    const user = await this.userRepository.registryOrGetUser({
      email: userInfoData?.email,
      phone: normalizedMobile,
      photo: userInfoData?.avatarUrl,
      name: userInfoData?.nick || userInfoData?.openId || 'dingtalk-user',
      externalId: `dingtalk:${externalId}`,
    });
    await this.userRepository.updateUserLastLogin(user.id, AuthMethod.oauth);
    const jwtToken = JwtHelper.signToken(user);
    return jwtToken;
  }
}
