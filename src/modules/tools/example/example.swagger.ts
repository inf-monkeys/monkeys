import { config } from '@/common/config';
import { INestApplication } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { ExampleToolsModule } from './example.module';

export const EXAMPLE_TOOL_OPENAPI_PATH = '/api/example-tool/openapi';
export const EXAMPLE_TOOL_OPENAPI_MENIFEST_URL = `http://127.0.0.1:${config.server.port}/api/example-tool/manifest.json`;

export const setupExampleToolSwagger = (app: INestApplication) => {
  const builder = new DocumentBuilder().setTitle('Simple Calc').setDescription('A simple calculation app').setVersion('1.0').addServer(`${config.server.appUrl}`, 'Example Calc Service API SERVER');
  const document = SwaggerModule.createDocument(app, builder.build(), {
    include: [ExampleToolsModule],
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
  SwaggerModule.setup(EXAMPLE_TOOL_OPENAPI_PATH, app, document);
};
