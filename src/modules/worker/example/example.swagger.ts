import { INestApplication } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { WorkerModule } from '../worker.module';

export const EXAMPLE_WORKER_OPENAPI_PATH = '/api/worker/example/openapi';

export const setupExampleWorkerSwagger = (app: INestApplication) => {
  const builder = new DocumentBuilder().setTitle('Simple Calc').setDescription('A simple sum calculation of two numbers.').setVersion('1.0').addServer('/api', 'VINES API SERVER').addBearerAuth();
  const document = SwaggerModule.createDocument(app, builder.build(), {
    include: [WorkerModule],
    deepScanRoutes: true,
  });
  SwaggerModule.setup(EXAMPLE_WORKER_OPENAPI_PATH, app, document);
};
