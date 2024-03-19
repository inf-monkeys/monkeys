import { AuthMethod, config } from '@/common/config';
import { Module, Provider } from '@nestjs/common';
import { PassportModule } from '@nestjs/passport';
import { AuthService } from './auth.service';
import { OidcController } from './oidc.controller';
import { OidcService } from './oidc.service';
import { OidcStrategy, buildOpenIdClient } from './oidc.strategy';
import { SessionSerializer } from './session.serializer';

const OidcStrategyFactory = {
  provide: 'OidcStrategy',
  useFactory: async () => {
    const client = await buildOpenIdClient(); // secret sauce! build the dynamic client before injecting it into the strategy for use in the constructor super call.
    const strategy = new OidcStrategy(client);
    return strategy;
  },
};

const providers: Provider[] = [AuthService];
if (config.auth.enabled.includes(AuthMethod.oidc)) {
  providers.push(OidcStrategyFactory);
  providers.push(SessionSerializer);
  providers.push(OidcService);
}

@Module({
  controllers: [OidcController],
  providers,
  imports: [PassportModule.register({ session: true, defaultStrategy: 'oidc' })],
})
export class AuthModule {}
