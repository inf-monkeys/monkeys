import { Module } from '@nestjs/common';
import { AuthMethod, config } from './common/config';
import { AssetsModule } from './modules/assets/assets.module';
import { ApikeyModule } from './modules/auth/apikey/apikey.module';
import { OidcModule } from './modules/auth/oidc/oidc.module';
import { PasswordModule } from './modules/auth/password/password.module';
import { PhoneModule } from './modules/auth/phone/phone.module';
import { TeamsModule } from './modules/auth/teams/teams.module';
import { UsersModule } from './modules/auth/users/users.module';
import { ChatModule } from './modules/chat/chat.module';
import { ToolsModule } from './modules/tools/tools.module';
import { WorkflowModule } from './modules/workflow/workflow.module';

const imports: Array<any> = [TeamsModule, UsersModule, WorkflowModule, ToolsModule, AssetsModule, ChatModule];
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
  imports,
})
export class OpenapiModule {}
