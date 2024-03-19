import { config } from '@/common/config';
import { OidcGuard } from '@/common/guards/oidc.guard';
import { IRequest } from '@/common/typings/request';
import { Controller, Get, Query, Req, Res, UseGuards } from '@nestjs/common';
import { Response } from 'express';
import { Issuer } from 'openid-client';

@Controller('/auth/oidc')
export class OidcController {
  @UseGuards(OidcGuard)
  @Get('/login')
  login() {}

  @Get('/user')
  user(@Req() req: IRequest) {
    return req.user;
  }

  @UseGuards(OidcGuard)
  @Get('/callback')
  loginCallback(@Query('state') state: string, @Res() res: Response, @Req() req: IRequest) {
    const redirect_to = state.replace('redirect_to=', '');
    res.redirect(`${redirect_to}?access_token=${req.user.access_token}`);
  }

  @Get('/logout')
  async logout(@Req() req: any, @Res() res: Response) {
    const id_token = req.user ? req.user.id_token : undefined;
    req.logout(() => {});
    req.session.destroy(async (error: any) => {
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
