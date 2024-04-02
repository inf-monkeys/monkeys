import { NestFactory } from '@nestjs/core';
import bodyParser from 'body-parser';
import RedisStore from 'connect-redis';
import cookieParser from 'cookie-parser';
import { rateLimit } from 'express-rate-limit';
import session, { MemoryStore } from 'express-session';
import { Redis } from 'ioredis';
import passport from 'passport';
import { AppModule } from './app.module';
import { config } from './common/config';
import { ExceptionsFilter } from './common/filters/exception.filter';
import { logger } from './common/logger';
import { ValidationPipe } from './common/pipes/validator.pipe';
import { BootstrapService } from './modules/bootstrap/bootstrap.service';
import { setupBuiltInWorkerSwagger } from './modules/tools/builtin/builtin.swagger';
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
  app.useGlobalPipes(new ValidationPipe());
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
  // Authentication & Session
  app.use(
    session({
      store: config.redis.url
        ? new RedisStore({
            client: new Redis(config.redis.url),
            prefix: config.redis.prefix,
          })
        : new MemoryStore(),
      secret: config.auth.sessionSecret, // to sign session id
      resave: false, // will default to false in near future: https://github.com/expressjs/session#resave
      saveUninitialized: false, // will default to false in near future: https://github.com/expressjs/session#saveuninitialized
      rolling: true, // keep session alive
      cookie: {
        maxAge: 30 * 60 * 1000, // session expires in 1hr, refreshed by `rolling: true` option.
        httpOnly: true, // so that cookie can't be accessed via client-side script
      },
    }),
  );
  app.use(passport.initialize());
  app.use(passport.session());

  setupExampleWorkerSwagger(app);
  setupBuiltInWorkerSwagger(app);
  setupSwagger(app);

  // String polling for tasks
  const toolsPollingService = await app.resolve<ToolsPollingService>(ToolsPollingService);
  toolsPollingService.startPolling();

  // System bootstrap
  const bootstrapService = await app.resolve<BootstrapService>(BootstrapService);
  await bootstrapService.bootstrap();

  await app.listen(config.server.port, '0.0.0.0');
  logger.info(`🚀: Start service at 0.0.0.0:${config.server.port} on port ${process.pid}`);
}
bootstrap();
