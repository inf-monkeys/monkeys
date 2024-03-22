import { config } from '@/common/config';
import { UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { Client, Issuer, Strategy, TokenSet, UserinfoResponse } from 'openid-client';

export const buildOpenIdClient = async () => {
  const TrustIssuer = await Issuer.discover(`${config.auth.oidc.issuer}/.well-known/openid-configuration`);
  const client = new TrustIssuer.Client({
    client_id: config.auth.oidc.client_id,
    client_secret: config.auth.oidc.client_secret,
    id_token_signed_response_alg: config.auth.oidc.id_token_signed_response_alg,
    token_endpoint_auth_method: config.auth.oidc.token_endpoint_auth_method,
    redirect_uri: config.auth.oidc.redirect_uri,
    scope: config.auth.oidc.scope,
  });
  return client;
};

export class OidcStrategy extends PassportStrategy(Strategy, 'oidc') {
  client: Client;

  constructor(client: Client) {
    super({
      client: client,
      params: {
        id_token_signed_response_alg: config.auth.oidc.id_token_signed_response_alg,
        token_endpoint_auth_method: config.auth.oidc.token_endpoint_auth_method,
        redirect_uri: config.auth.oidc.redirect_uri,
        scope: config.auth.oidc.scope,
      },
      passReqToCallback: false,
      usePKCE: false,
    });

    this.client = client;
  }

  async validate(tokenset: TokenSet): Promise<any> {
    const userinfo: UserinfoResponse = await this.client.userinfo(tokenset);

    try {
      const id_token = tokenset.id_token;
      const access_token = tokenset.access_token;
      const refresh_token = tokenset.refresh_token;
      const user = {
        id_token,
        access_token,
        refresh_token,
        userinfo,
      };
      return user;
    } catch (err) {
      throw new UnauthorizedException();
    }
  }
}
