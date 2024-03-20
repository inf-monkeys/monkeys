import { config } from '@/common/config';
import { Injectable } from '@nestjs/common';
import { buildOpenIdClient } from './oidc.strategy';

@Injectable()
export class OidcService {
  public async getAccessTokenByCode() {
    const client = await buildOpenIdClient();
    const params = client.callbackParams(config.auth.oidc.redirect_uri);
    const tokenSet = await client.callback(config.auth.oidc.redirect_uri, {
      params,
    });
    return tokenSet;
  }
}
