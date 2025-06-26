import { setupTranslateToolSwagger } from '@/modules/tools/translate/translate.swagger';
import { RequestMethod } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import bodyParser from 'body-parser';
import RedisStore from 'connect-redis';
import cookieParser from 'cookie-parser';
import { rateLimit } from 'express-rate-limit';
import session, { MemoryStore } from 'express-session';
import passport from 'passport';
import { AppModule } from './app.module';
import { config, isRedisConfigured } from './common/config';
import { ExceptionsFilter } from './common/filters/exception.filter';
import { logger } from './common/logger';
import { ValidationPipe } from './common/pipes/validator.pipe';
import { initRedisClient } from './common/redis';
import { BootstrapService } from './modules/bootstrap/bootstrap.service';
import { setupComfyuiToolSwagger } from './modules/tools/comfyui/comfyui.swagger';
import { setupExampleToolSwagger } from './modules/tools/example/example.swagger';
import { setupLlmToolSwagger } from './modules/tools/llm/llm.swagger';
import { setupMediaToolSwagger } from './modules/tools/media/media.swagger';
import { ToolsPollingService } from './modules/tools/tools.polling.service';
import { setupSwagger } from './setupSwagger';

process.on('unhandledRejection', (err: Error) => {
  logger.error('unhandledRejection: ', err);
});

process.on('uncaughtException', (err: Error) => {
  logger.error('uncaughtException: ', err);
});

process.env['NODE_TLS_REJECT_UNAUTHORIZED'] = '0';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  app.setGlobalPrefix('/api/', {
    exclude: [
      {
        path: '/v1/chat/completions',
        method: RequestMethod.POST,
      },
      {
        path: '/v1/completions',
        method: RequestMethod.POST,
      },
      {
        path: '/v1/models',
        method: RequestMethod.GET,
      },
      {
        path: '/metrics',
        method: RequestMethod.GET,
      },
    ],
  });
  app.useGlobalPipes(new ValidationPipe());
  app.useGlobalFilters(new ExceptionsFilter());
  app.use(bodyParser.json({ limit: '100mb' }));
  app.use(bodyParser.urlencoded({ limit: '100mb', extended: true }));
  app.use(bodyParser.raw({ limit: '100mb' }));
  app.use(cookieParser());
  // app.enableCors({
  //   methods: 'GET,HEAD,PUT,PATCH,POST,DELETE'.split(','),
  //   origin: '*',
  // });
  if (config.server.rateLimit.enabled) {
    app.use(
      rateLimit({
        windowMs: config.server.rateLimit.windowMs,
        max: config.server.rateLimit.max,
      }),
    );
  }
  // Authentication & Session
  app.use(
    session({
      store: isRedisConfigured()
        ? new RedisStore({
            client: initRedisClient(config.redis),
            prefix: config.redis.prefix || config.server.appId,
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

  setupExampleToolSwagger(app);
  setupLlmToolSwagger(app);
  setupComfyuiToolSwagger(app);
  setupTranslateToolSwagger(app);
  setupMediaToolSwagger(app);
  setupSwagger(app);

  // String polling for tasks
  const toolsPollingService = await app.resolve<ToolsPollingService>(ToolsPollingService);
  void toolsPollingService.startPolling();

  // System bootstrap
  const bootstrapService = await app.resolve<BootstrapService>(BootstrapService);
  await bootstrapService.bootstrap();

  await app.listen(config.server.port, '0.0.0.0');
  logger.info(`🚀: Start service at 0.0.0.0:${config.server.port} on pid ${process.pid}`);
}
bootstrap();
