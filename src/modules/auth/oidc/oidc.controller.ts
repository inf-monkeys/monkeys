import { config } from '@/common/config';
import { OidcGuard } from '@/common/guards/oidc.guard';
import { IRequest } from '@/common/typings/request';
import { Controller, Get, Query, Req, Res, UseGuards } from '@nestjs/common';
import { ApiExcludeEndpoint, ApiOperation, ApiTags } from '@nestjs/swagger';
import { Response } from 'express';
import { Issuer } from 'openid-client';
import { JwtHelper } from '../jwt-utils';
import { UsersService } from '../users/users.service';

@Controller('/auth/oidc')
@ApiTags('Auth/OIDC')
export class OidcController {
  constructor(private readonly userService: UsersService) {}

  @UseGuards(OidcGuard)
  @Get('/login')
  @ApiOperation({
    description: 'OIDC 登录',
    summary: 'OIDC 登录',
  })
  login() {}

  @UseGuards(OidcGuard)
  @Get('/callback')
  @ApiExcludeEndpoint()
  async loginCallback(@Query('state') state: string, @Res() res: Response, @Req() req: IRequest) {
    const redirect_to = state.replace('redirect_to=', '');
    const id_token = req.user.id_token;
    const user = await this.userService.registerByOidcIdToken(id_token);
    const jwtToken = JwtHelper.signToken(user);
    res.redirect(`${redirect_to}?access_token=${jwtToken}`);
  }

  @Get('/logout')
  @ApiOperation({
    description: 'OIDC 登出',
    summary: 'OIDC 登出',
  })
  async logout(@Req() req: any, @Res() res: Response) {
    const id_token = req.user ? req.user.id_token : undefined;
    req.logout(() => {});
    req.session.destroy(async () => {
      const TrustIssuer = await Issuer.discover(`${config.auth.oidc.issuer}/.well-known/openid-configuration`);
      const end_session_endpoint = TrustIssuer.metadata.end_session_endpoint;
      if (end_session_endpoint) {
        res.redirect(end_session_endpoint + '?post_logout_redirect_uri=' + config.auth.oidc.post_logout_redirect_uri + (id_token ? '&id_token_hint=' + id_token : ''));
      } else {
        res.redirect('/');
      }
    });
  }
}
