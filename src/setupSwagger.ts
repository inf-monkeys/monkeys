import { INestApplication } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import _ from 'lodash';
import { AuthMethod, config } from './common/config';
import { APIKEY_AUTH_DOC, NONE_AUTH_DOC } from './common/openapi';
import { OpenapiModule } from './openapi.module';

export const setupSwagger = (app: INestApplication) => {
  const builder = new DocumentBuilder().setTitle('Monkeys OPEN API').setDescription('Monkeys OPEN API').setVersion('1.0').addServer('/', 'VINES API SERVER').addBearerAuth();
  const document = SwaggerModule.createDocument(app, builder.build(), {
    include: [OpenapiModule],
    deepScanRoutes: true,
  });
  for (const path in document.paths) {
    for (const method in document.paths[path]) {
      const tags = document.paths[path][method].tags;
      if (tags?.length) {
        for (const tag of tags) {
          if (!document.tags.find((x) => x.name === tag)) {
            document.tags.push({
              name: tag,
              description: '',
            });
          }
        }
      }
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
      description: `此文档为 Monkeys 服务 API，有关此服务注册的所有 Tools 的 API 文档请见 [/openapi/tools](/openapi/tools)`,
    },
    {
      name: '开发准备/鉴权机制',
      'x-displayName': '鉴权机制',
      description: config.auth.enabled.includes(AuthMethod.apikey) ? APIKEY_AUTH_DOC : NONE_AUTH_DOC,
    },
  ];

  tags = tags.concat(
    document.tags?.map((x) => ({
      name: x.name,
      description: x.description,
      'x-displayName': x.name.split('/')[x.name.split('/').length - 1],
    })),
  );

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
  for (const tag of document.tags) {
    const group = tag.name.split('/')[0];
    if (!_.find(tagGroups, (x) => x.name === group)) {
      tagGroups.push({
        name: group,
        tags: [tag.name],
      });
    } else {
      const index = _.findIndex(tagGroups, (x) => x.name === group);
      const originalTagGroup = tagGroups[index];
      tagGroups.splice(index, 1, {
        name: originalTagGroup.name,
        description: originalTagGroup.description,
        tags: originalTagGroup.tags.concat(tag.name),
      });
    }
  }
  document.tags = tags;
  document['x-tagGroups'] = tagGroups;

  SwaggerModule.setup('/openapi', app, document, {
    explorer: false,
  });
};
