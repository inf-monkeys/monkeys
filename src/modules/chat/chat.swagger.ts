import { config } from '@/common/config';
import { INestApplication } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { ChatModule } from './chat.module';

export const CHAT_TOOL_OPENAPI_PATH = '/api/chat/openapi';
export const CHAT_TOOL_OPENAPI_MENIFEST_URL = `http://127.0.0.1:${config.server.port}/api/chat/manifest.json`;

export const setupChatToolSwagger = (app: INestApplication) => {
  const builder = new DocumentBuilder().setTitle('LLM').setDescription('Chat endpoints').setVersion('1.0').addServer(`${config.server.appUrl}`, 'Chat API SERVER');
  const document = SwaggerModule.createDocument(app, builder.build(), {
    include: [ChatModule],
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
