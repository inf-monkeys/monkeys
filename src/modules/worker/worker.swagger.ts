import { INestApplication } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { WorkerModule } from './worker.module';

export const setupExampleWorkerSwagger = (app: INestApplication) => {
  const builder = new DocumentBuilder().setTitle('Simple Calc').setDescription('A simple sum calculation of two numbers.').setVersion('1.0').addServer('/api', 'VINES API SERVER').addBearerAuth();
  const document = SwaggerModule.createDocument(app, builder.build(), {
    include: [WorkerModule],
    deepScanRoutes: true,
  });
  SwaggerModule.setup('/api/worker/openapi', app, document);
};
