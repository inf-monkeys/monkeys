import { config } from '@/common/config';
import { CompatibleAuthGuard } from '@/common/guards/auth.guard';
import { SuccessResponse } from '@/common/response';
import { IRequest } from '@/common/typings/request';
import { Body, Controller, Delete, Get, Post, Query, Req, Res, UseGuards } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { Response } from 'express';
import { AuthResultType, OAuthService } from './oauth.service';

@Controller('/auth/oauth')
@ApiTags('Auth/OAuth')
export class OAuthController {
  constructor(private readonly oauthService: OAuthService) {}

  // 企业微信回调
  @Get('wework/callback')
  @ApiOperation({
    description: '使用企业微信登录',
    summary: '使用企业微信登录',
  })
  public async loginByWeworkOauth(@Query('code') code: string, @Query('state') state: string, @Res() res: Response) {
    const baseUrl = config.server.appUrl;

    if (code) {
      const { type, ...rest } = await this.oauthService.handleWeworkCallback(code, state);

      if (type === AuthResultType.ERROR) {
        return res.redirect(`${baseUrl}/login/callback?error=${encodeURIComponent(rest.message)}`);
      }

      if (type === AuthResultType.BIND_CODE) {
        return res.redirect(`${baseUrl}/login/oauth?provider=wework&bind_code=${rest.bindCode}`);
      }

      return res.redirect(`${baseUrl}/login/callback?access_token=${rest.jwt}`);
    }

    res.redirect(`${baseUrl}/login`);
  }

  @Get('wework/info')
  @ApiOperation({
    description: '获取企业微信 OAuth 信息',
    summary: '获取企业微信用户 OAuth 信息',
  })
  public async getWeworkInfo() {
    return new SuccessResponse({
      data: {
        corpId: config.auth.wework.corpId,
        agentid: config.auth.wework.agentId,
        redirect_uri: `${config.server.appUrl}/api/auth/oauth/wework/callback`,
      },
    });
  }

  @Post('wework/bind')
  @ApiOperation({
    description: '绑定企业微信',
    summary: '绑定企业微信',
  })
  @UseGuards(CompatibleAuthGuard)
  public async bindWework(@Req() req: IRequest, @Body() body: { code: string }) {
    const { userId } = req;
    const { code } = body;
    try {
      const result = await this.oauthService.bindWework(code, userId);
      return new SuccessResponse({
        data: result,
      });
    } catch (e) {
      return new SuccessResponse({
        code: 400,
        data: null,
        message: e.message,
      });
    }
  }

  @Delete('wework/bind')
  @ApiOperation({
    description: '解绑企业微信',
    summary: '解绑企业微信',
  })
  @UseGuards(CompatibleAuthGuard)
  public async unbindWework(@Req() req: IRequest) {
    const { userId } = req;
    try {
      const result = await this.oauthService.unbindWework(userId);
      return new SuccessResponse({
        data: result,
      });
    } catch (e) {
      return new SuccessResponse({
        code: 400,
        data: null,
        message: e.message,
      });
    }
  }
}
