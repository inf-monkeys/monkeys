import { MiddlewareConsumer, Module, RequestMethod } from '@nestjs/common';
import { ScheduleModule } from '@nestjs/schedule';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { CommonMiddleware } from './common/middlewares/common.middleware';
import { ToolsMiddleware } from './common/middlewares/tools.middleware';
import { ExportModule } from './modules/export/export.module';
import { GatewaysModule } from './modules/gateways/gateways.module';
import { CronJobModule } from './modules/infra/cron/cron.module';
import { DatabaseModule } from './modules/infra/database/database.module';
import { RepositoryMoule } from './modules/infra/database/repositories/repositories.module';
import { OpenapiModule } from './modules/openapi/openapi.module';
import { ToolsModule } from './modules/tools/tools.module';
import { WorkflowModule } from './modules/workflow/workflow.module';

@Module({
  imports: [DatabaseModule, ToolsModule, RepositoryMoule, WorkflowModule, OpenapiModule, GatewaysModule, ScheduleModule.forRoot(), CronJobModule, ExportModule],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(CommonMiddleware).forRoutes({ path: '*', method: RequestMethod.ALL });
    consumer.apply(ToolsMiddleware).forRoutes({ path: '/api/system-tools', method: RequestMethod.ALL });
  }
}
