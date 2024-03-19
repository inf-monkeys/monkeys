import { ExecutionContext, Injectable } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { config } from '../config';

@Injectable()
export class OidcGuard extends AuthGuard('oidc') {
  getAuthenticateOptions(context: ExecutionContext) {
    const req = context.switchToHttp().getRequest();
    const redirect_to = req.query.redirect_to || `http://localhost:${config.server.port}`;
    return {
      state: `redirect_to=${redirect_to}`,
    };
  }

  async canActivate(context: ExecutionContext) {
    const request = context.switchToHttp().getRequest();
    const result = (await super.canActivate(context)) as boolean;
    await super.logIn(request);
    return result;
  }
}
