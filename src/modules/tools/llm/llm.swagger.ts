import { config } from '@/common/config';
import { INestApplication } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { LLmModule } from './llm.module';

export const LLM_TOOL_OPENAPI_PATH = '/api/llm/openapi';
export const LLM_TOOL_OPENAPI_MENIFEST_URL = `${config.server.appUrl}/api/llm/manifest.json`;

export const setupLlmToolSwagger = (app: INestApplication) => {
  const builder = new DocumentBuilder().setTitle('LLM').setDescription('LLM Chat endpoints').setVersion('1.0').addServer(`${config.server.appUrl}`, 'Chat API SERVER');
  const document = SwaggerModule.createDocument(app, builder.build(), {
    include: [LLmModule],
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
  SwaggerModule.setup(LLM_TOOL_OPENAPI_PATH, app, document);
};
