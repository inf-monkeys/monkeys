import { config } from '@/common/config';
import { INestApplication } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { BuiltinToolsModule } from './builtin.module';

export const BUILTIN_TOOL_OPENAPI_PATH = '/api/system-tools/openapi';
export const BUILTIN_TOOL_OPENAPI_MENIFEST_URL = `http://localhost:${config.server.port}/api/system-tools/manifest.json`;

export const setupBuiltInWorkerSwagger = (app: INestApplication) => {
  const builder = new DocumentBuilder()
    .setTitle('Monkeys BuiltIn Tools')
    .setDescription('Monkeys builtIn tools')
    .setVersion('1.0')
    .addServer(`http://localhost:${config.server.port}`, 'Example Calc Service API SERVER');
  const document = SwaggerModule.createDocument(app, builder.build(), {
    include: [BuiltinToolsModule],
    deepScanRoutes: true,
  });
  SwaggerModule.setup(BUILTIN_TOOL_OPENAPI_PATH, app, document);
};
