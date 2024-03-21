import { config } from '@/common/config';
import { INestApplication } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { BuiltinToolsModule } from './builtin.module';

export const BUILTIN_TOOL_OPENAPI_PATH = '/api/system-tools/openapi';
export const BUILTIN_TOOL_OPENAPI_MENIFEST_URL = `${config.server.appUrl}/api/system-tools/manifest.json`;

export const setupBuiltInWorkerSwagger = (app: INestApplication) => {
  const builder = new DocumentBuilder()
    .setTitle('Monkeys BuiltIn Tools')
    .setDescription('Monkeys builtIn tools')
    .setVersion('1.0')
    .addServer(`${config.server.appUrl}`, 'Example Calc Service API SERVER');
  const document = SwaggerModule.createDocument(app, builder.build(), {
    include: [BuiltinToolsModule],
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
  SwaggerModule.setup(BUILTIN_TOOL_OPENAPI_PATH, app, document);
};
