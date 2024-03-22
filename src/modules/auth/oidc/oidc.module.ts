import { Module } from '@nestjs/common';
import { PassportModule } from '@nestjs/passport';
import { UsersModule } from '../users/users.module';
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

@Module({
  controllers: [OidcController],
  providers: [OidcStrategyFactory, SessionSerializer, OidcService],
  imports: [UsersModule, PassportModule.register({ session: true, defaultStrategy: 'oidc' })],
})
export class OidcModule {}
