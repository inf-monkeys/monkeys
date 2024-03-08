import { INestApplication } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { OpenapiModule } from './modules/openapi/openapi.module';

export const setupSwagger = (app: INestApplication) => {
  const builder = new DocumentBuilder().setTitle('VINES OPEN API').setDescription('VINES OPEN API').setVersion('1.0').addServer('/api', 'VINES API SERVER').addBearerAuth();
  const document = SwaggerModule.createDocument(app, builder.build(), {
    include: [OpenapiModule],
    deepScanRoutes: true,
  });
  SwaggerModule.setup('/openapi', app, document);
};
