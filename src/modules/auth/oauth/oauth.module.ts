import { Module } from '@nestjs/common';
import { OAuthController } from './oauth.controller';
import { OAuthService } from './oauth.service';
import { AuthType, WechatWorkModule } from 'nestjs-wechat-work';
import { config } from '@/common/config';
import { HttpModule } from '@nestjs/axios';

console.log(config.auth.wework.corpId);

@Module({
  imports: [
    WechatWorkModule.register({
      baseConfig: {
        corpId: config.auth.wework.corpId,
        agentId: config.auth.wework.agentId,
        agentSecret: config.auth.wework.secret,
      },
      authConfig: {
        type: AuthType.CALLBACK_TOKEN,
        returnDomainName: config.server.appUrl,
        jwtSecret: config.auth.jwt.secret,
        loginFailPath: '/login',
      },
    }),
    HttpModule,
  ],
  controllers: [OAuthController],
  providers: [OAuthService],
})
export class OAuthModule {}
