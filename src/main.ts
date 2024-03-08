import { NestFactory } from '@nestjs/core';
import bodyParser from 'body-parser';
import cookieParser from 'cookie-parser';
import { rateLimit } from 'express-rate-limit';
import { AppModule } from './app.module';
import { config } from './common/config';
import { ExceptionsFilter } from './common/filters/exception.filter';
import { logger } from './common/logger';
import { setupExampleWorkerSwagger } from './modules/tools/example/example.swagger';
import { ToolsPollingService } from './modules/tools/tools.polling.service';
import { setupSwagger } from './setupSwagger';

process.on('unhandledRejection', (err: Error) => {
  logger.error('unhandledRejection: ', err);
});

process.on('uncaughtException', (err: Error) => {
  logger.error('uncaughtException: ', err);
});

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  app.setGlobalPrefix('/api/');
  app.useGlobalFilters(new ExceptionsFilter());
  app.use(bodyParser.json({ limit: '100mb' }));
  app.use(bodyParser.urlencoded({ limit: '100mb', extended: true }));
  app.use(bodyParser.raw({ limit: '100mb' }));
  app.use(cookieParser());
  app.enableCors({
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE'.split(','),
    origin: '*',
  });
  app.use(
    rateLimit({
      windowMs: 1000, // 15 minutes
      max: 100, // limit each IP to 100 requests per windowMs
    }),
  );

  setupExampleWorkerSwagger(app);
  setupSwagger(app);

  // String polling for tasks
  const workerPollingService = await app.resolve<ToolsPollingService>(ToolsPollingService);
  workerPollingService.startPolling();

  await app.listen(config.server.port);
}
bootstrap();
