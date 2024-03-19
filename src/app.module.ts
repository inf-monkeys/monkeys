import { MiddlewareConsumer, Module, RequestMethod } from '@nestjs/common';
import { ScheduleModule } from '@nestjs/schedule';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { CommonMiddleware } from './common/middlewares/common.middleware';
import { ToolsMiddleware } from './common/middlewares/tools.middleware';
import { DatabaseModule } from './entities/database.module';
import { AuthModule } from './modules/auth/auth.module';
import { BootstrapModule } from './modules/bootstrap/bootstrap.module';
import { ComfyuiModule } from './modules/comfyui/comfyui.module';
import { ExportModule } from './modules/export/export.module';
import { GatewaysModule } from './modules/gateways/gateways.module';
import { CronJobModule } from './modules/infra/cron/cron.module';
import { ToolsModule } from './modules/tools/tools.module';
import { WorkflowModule } from './modules/workflow/workflow.module';
import { OpenapiModule } from './openapi.module';
import { RepositoryMoule } from './repositories/repositories.module';

@Module({
  imports: [
    DatabaseModule,
    ToolsModule,
    RepositoryMoule,
    WorkflowModule,
    OpenapiModule,
    GatewaysModule,
    ScheduleModule.forRoot(),
    CronJobModule,
    ExportModule,
    ComfyuiModule,
    BootstrapModule,
    AuthModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(CommonMiddleware).forRoutes({ path: '*', method: RequestMethod.ALL });
    consumer.apply(ToolsMiddleware).forRoutes({ path: '/api/system-tools', method: RequestMethod.ALL });
  }
}
