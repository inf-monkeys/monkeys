import { Controller, Get } from '@nestjs/common';
import _ from 'lodash';
import { isErrorResult, merge } from 'openapi-merge';
import { AppService } from './app.service';
import { config } from './common/config';
import { SuccessResponse } from './common/response';
import { ISystemConfig } from './common/typings/system';

@Controller()
export class AppController {
  constructor(private readonly service: AppService) {}

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
      const tagGroups = [
        {
          name: '开发准备',
          tags: ['开发准备/基本概念'],
        },
      ];
      for (const path in output.paths) {
        const namespace = path.split('/')[3];
        const displayName = data.find((x) => x.namespace === namespace).displayName;
        for (const method in output.paths[path]) {
          let tags = output.paths[path][method].tags;
          if (tags) {
            // tags = tags.map((tag) => `${displayName}/${tag}`);
          } else {
            tags = [`${displayName}`];
          }
          output.paths[path][method].tags = tags;
          if (!_.find(tagGroups, (x) => x.name === displayName)) {
            tagGroups.push({
              name: displayName,
              tags: tags,
            });
          } else {
            const index = _.findIndex(tagGroups, (x) => x.name === displayName);
            const newTags = _.uniq(tagGroups[index].tags.concat(tags));
            tagGroups.splice(index, 1, {
              name: tagGroups[index].name,
              tags: newTags,
            });
          }
        }
      }
      output['x-tagGroups'] = tagGroups;
      return output;
    }
  }

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
