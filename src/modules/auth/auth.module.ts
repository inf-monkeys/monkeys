import { AuthMethod, config } from '@/common/config';
import { Module } from '@nestjs/common';
import { ApikeyModule } from './apikey/apikey.module';
import { OidcModule } from './oidc/oidc.module';
import { PasswordModule } from './password/password.module';
import { PhoneModule } from './phone/phone.module';

const imports: Array<any> = [];
if (config.auth.enabled.includes(AuthMethod.oidc)) {
  imports.push(OidcModule);
}
if (config.auth.enabled.includes(AuthMethod.password)) {
  imports.push(PasswordModule);
}
if (config.auth.enabled.includes(AuthMethod.phone)) {
  imports.push(PhoneModule);
}
if (config.auth.enabled.includes(AuthMethod.apikey)) {
  imports.push(ApikeyModule);
}

@Module({
  controllers: [],
  providers: [],
  imports,
})
export class AuthModule {}
