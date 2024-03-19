import { Controller, Get } from '@nestjs/common';
import { config } from './common/config';
import { SuccessResponse } from './common/response';
import { ISystemConfig } from './common/typings/system';

@Controller()
export class AppController {
  constructor() {}

  @Get('/configs')
  public getConfigs() {
    const data: ISystemConfig = {
      theme: {
        name: '猴子无限',
        logoUrl: 'https://static.aside.fun/static/vines.svg',
        favicon: {
          url: 'https://static.infmonkeys.com/upload/favicon.svg',
          type: 'image/svg+xml',
        },
        colors: {
          primaryColor: '#52ad1f',
          backgroundColor: '#16161a',
          secondaryBackgroundColor: '#212121',
        },
      },
      auth: {
        enabled: config.auth.enabled,
        oidc: {
          buttonText: config.auth.oidc.button_text,
        },
      },
      pages: {
        allowPageKeys: '*',
      },
      endpoints: {
        clientUrl: 'https://ai.infmonkeys.com',
      },
      module: ['payment'],
    };
    return new SuccessResponse({
      data,
    });
  }
}
