import { config } from '@/common/config';
import { INestApplication } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { TranslateToolsModule } from './translate.module';

export const TRANSLATE_TOOL_OPENAPI_PATH = '/api/translate-tool/openapi';
export const TRANSLATE_TOOL_OPENAPI_MANIFEST_URL = `http://127.0.0.1:${config.server.port}/api/translate-tool/manifest.json`;

export const setupTranslateToolSwagger = (app: INestApplication) => {
  const builder = new DocumentBuilder().setTitle('文本翻译').setDescription('文本翻译').setVersion('1.0').addServer(`${config.server.appUrl}`, 'Translation Service API SERVER');
  const document = SwaggerModule.createDocument(app, builder.build(), {
    include: [TranslateToolsModule],
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
  SwaggerModule.setup(TRANSLATE_TOOL_OPENAPI_PATH, app, document);
};
