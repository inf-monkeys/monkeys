import { config } from '@/common/config';
import { INestApplication } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { ExampleModule } from './example.module';

export const EXAMPLE_WORKER_OPENAPI_PATH = '/api/worker/example/openapi';

export const setupExampleWorkerSwagger = (app: INestApplication) => {
  const builder = new DocumentBuilder()
    .setTitle('Simple Calc')
    .setDescription('A simple calculation app')
    .setVersion('1.0')
    .addServer(`http://localhost:${config.server.port}`, 'Example Calc Service API SERVER');
  const document = SwaggerModule.createDocument(app, builder.build(), {
    include: [ExampleModule],
    deepScanRoutes: true,
  });
  SwaggerModule.setup(EXAMPLE_WORKER_OPENAPI_PATH, app, document);
};
