import { Controller, Get, Inject } from '@nestjs/common';
import { isErrorResult, merge } from 'openapi-merge';
import { AppService } from './app.service';
import { CacheManager } from './common/cache';
import { CACHE_TOKEN, MQ_TOKEN } from './common/common.module';
import { AuthMethod, config } from './common/config';
import { Mq } from './common/mq';
import { APIKEY_AUTH_DOC, NONE_AUTH_DOC } from './common/openapi';
import { SuccessResponse } from './common/response';
import { ISystemConfig } from './common/typings/system';

@Controller()
export class AppController {
  constructor(
    private readonly service: AppService,
    @Inject(CACHE_TOKEN) private readonly cache: CacheManager,
    @Inject(MQ_TOKEN) private readonly mq: Mq,
  ) {}

  @Get('/healthz')
  public async healthz() {
    return {
      status: 'OK',
    };
  }

  @Get('/tools-openapi.json')
  public async getCombinedToolsSwagger() {
    const data = await this.service.getCombinedToolsSwagger();
    const mergeResult = merge(
      data.map((item) => ({
        oas: item.spec as any,
        pathModification: {
          prepend: `/api/tools/${item.namespace}`,
        },
      })),
    );
    if (isErrorResult(mergeResult)) {
      // Oops, something went wrong
      throw new Error(`${mergeResult.message} (${mergeResult.type})`);
    } else {
      const output = mergeResult.output;
      output.info.title = 'Monkeys Tools API';
      output.info.description = 'Monkeys Tools API';
      output.servers = [
        {
          description: 'Monkeys Tools Server',
          url: config.server.appUrl,
        },
      ];

      for (const path in output.paths) {
        const namespace = path.split('/')[3];
        const displayName = data.find((x) => x.namespace === namespace).displayName;
        for (const method in output.paths[path]) {
          let tags = output.paths[path][method].tags;
          if (tags) {
            tags = tags.map((tag) => `${displayName}/${tag}`);
          }
          output.paths[path][method].tags = tags;
        }
      }

      let tags: Array<{
        name: string;
        description?: string;
        'x-displayName'?: string;
      }> = [
        {
          name: '开发准备/介绍',
          'x-displayName': '介绍',
        },
        {
          name: '开发准备/鉴权机制',
          'x-displayName': '鉴权机制',
          description: config.auth.enabled.includes(AuthMethod.apikey) ? APIKEY_AUTH_DOC : NONE_AUTH_DOC,
        },
      ];
      const tagGroups: Array<{
        name: string;
        tags: string[];
        description?: string;
      }> = [
        {
          name: '开发准备',
          tags: ['开发准备/介绍', '开发准备/鉴权机制'],
        },
      ];
      for (const server of data) {
        const itemTags = server.spec.tags?.map((x) => ({
          name: `${server.displayName}/${x.name}`,
          description: x.description,
          'x-displayName': x.name.split('/')[x.name.split('/').length - 1],
        }));
        tagGroups.push({
          name: server.displayName,
          tags: itemTags.map((x) => x.name),
        });
        tags = tags.concat(itemTags);
      }
      output.tags = tags;
      output['x-tagGroups'] = tagGroups;
      return output;
    }
  }

  @Get('/configs')
  public getConfigs() {
    const module: ISystemConfig['module'] = [];

    if (config.paymentServer.enabled) {
      module.push('payment');
    }

    const data: ISystemConfig = {
      theme: {
        title: config.server.customization.title,
        logo: config.server.customization.logo,
        favicon: config.server.customization.favicon,
        colors: {
          primaryColor: config.server.customization.colors.primary,
          neocardColor: config.server.customization.colors.neocard,
          neocardDarkColor: config.server.customization.colors.neocardDark,
        },
        toast: {
          position: config.server.customization.toast.position,
        },
        icons: config.server.customization.icons,
        views: config.server.customization.views,
        hideSpaceHeader: config.server.customization.hideSpaceHeader,
        showSidebarTeamSelector: config.server.customization.showSidebarTeamSelector,
        showSidebarPageGroup: config.server.customization.showSidebarPageGroup,
        defaults: config.server.customization.defaults,
        modules: config.server.customization.modules,
      },
      auth: {
        enabled: config.auth.enabled,
        oidc: {
          buttonText: config.auth.oidc.button_text,
          autoSignin: config.auth.oidc.auto_signin,
        },
        hideAuthToast: config.auth.hideAuthToast,
        autoReload: config.auth.autoReload,
        defaultOtherTeam: config.auth.defaultOtherTeam,
      },
      pages: {
        allowPageKeys: '*',
      },
      endpoints: {
        clientUrl: 'https://ai.infmonkeys.com',
      },
      module,
    };
    return new SuccessResponse({
      data,
    });
  }
}
