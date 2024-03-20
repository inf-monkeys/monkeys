import { AuthMethod, config } from '@/common/config';
import { Module } from '@nestjs/common';
import { OidcModule } from './oidc/oidc.module';
import { PasswordModule } from './password/password.module';

const imports: Array<any> = [];
if (config.auth.enabled.includes(AuthMethod.oidc)) {
  imports.push(OidcModule);
}
console.log(config.auth.enabled);
if (config.auth.enabled.includes(AuthMethod.password)) {
  imports.push(PasswordModule);
}

@Module({
  controllers: [],
  providers: [],
  imports,
})
export class AuthModule {}
