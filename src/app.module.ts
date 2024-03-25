import { MiddlewareConsumer, Module, RequestMethod } from '@nestjs/common';
import { ScheduleModule } from '@nestjs/schedule';
import { ServeStaticModule } from '@nestjs/serve-static';
import { join } from 'path';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { CacheModule } from './common/cache/cache.module';
import { ToolsMiddleware } from './common/middlewares/tools.middleware';
import { DatabaseModule } from './database/database.module';
import { RepositoryMoule } from './database/repositories/repositories.module';
import { AuthModule } from './modules/auth/auth.module';
import { BootstrapModule } from './modules/bootstrap/bootstrap.module';
import { ExportModule } from './modules/export/export.module';
import { GatewaysModule } from './modules/gateways/gateways.module';
import { CronJobModule } from './modules/infra/cron/cron.module';
import { ToolsModule } from './modules/tools/tools.module';
import { WorkflowModule } from './modules/workflow/workflow.module';
import { OpenapiModule } from './openapi.module';

@Module({
  imports: [
    ServeStaticModule.forRoot({
      rootPath: join(__dirname, '..', 'public'),
    }),
    DatabaseModule,
    CacheModule,
    ToolsModule,
    RepositoryMoule,
    WorkflowModule,
    OpenapiModule,
    GatewaysModule,
    ScheduleModule.forRoot(),
    CronJobModule,
    ExportModule,
    BootstrapModule,
    AuthModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(ToolsMiddleware).forRoutes({ path: '/api/system-tools', method: RequestMethod.ALL });
  }
}
