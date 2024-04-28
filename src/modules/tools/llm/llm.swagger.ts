import { config } from '@/common/config';
import { INestApplication } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { LLMToolsModule } from './llm.module';

export const CHAT_TOOL_OPENAPI_PATH = '/api/chat/openapi';
export const CHAT_TOOL_OPENAPI_MENIFEST_URL = `http://127.0.0.1:${config.server.port}/api/llm-tool/manifest.json`;

export const setupLlmToolSwagger = (app: INestApplication) => {
  const builder = new DocumentBuilder().setTitle('LLM').setDescription('LLM endpoints').setVersion('1.0').addServer(`${config.server.appUrl}`, 'LLM API SERVER');
  const document = SwaggerModule.createDocument(app, builder.build(), {
    include: [LLMToolsModule],
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
  SwaggerModule.setup(CHAT_TOOL_OPENAPI_PATH, app, document);
};
