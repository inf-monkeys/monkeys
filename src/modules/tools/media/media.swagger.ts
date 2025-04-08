import { config } from '@/common/config';
import { INestApplication } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { MediaToolsModule } from './media.module';

export const MEDIA_TOOL_OPENAPI_PATH = '/api/media-tool/openapi';
export const MEDIA_TOOL_OPENAPI_MANIFEST_URL = `http://127.0.0.1:${config.server.port}/api/media-tool/manifest.json`;

export const setupMediaToolSwagger = (app: INestApplication) => {
  const builder = new DocumentBuilder().setTitle('媒体工具').setDescription('媒体工具').setVersion('1.0').addServer(`${config.server.appUrl}`, 'Media Service API SERVER');
  const document = SwaggerModule.createDocument(app, builder.build(), {
    include: [MediaToolsModule],
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
  SwaggerModule.setup(MEDIA_TOOL_OPENAPI_PATH, app, document);
};
