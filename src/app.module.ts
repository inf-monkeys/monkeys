import { MiddlewareConsumer, Module, RequestMethod } from '@nestjs/common';
import { ScheduleModule } from '@nestjs/schedule';
import { ServeStaticModule } from '@nestjs/serve-static';
import { join } from 'path';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { CommonModule } from './common/common.module';
import { ToolsMiddleware } from './common/middlewares/tools.middleware';
import { CronJobModule } from './cronjobs/cron.module';
import { DatabaseModule } from './database/database.module';
import { RepositoryMoule } from './database/repositories.module';
import { AssetsModule } from './modules/assets/assets.module';
import { AuthModule } from './modules/auth/auth.module';
import { BootstrapModule } from './modules/bootstrap/bootstrap.module';
import { ChatModule } from './modules/chat/chat.module';
import { ExportModule } from './modules/export/export.module';
import { LLMToolsModule } from './modules/tools/llm/llm.module';
import { ToolsModule } from './modules/tools/tools.module';
import { WorkflowModule } from './modules/workflow/workflow.module';
import { OpenapiModule } from './openapi.module';
import { PaymentModule } from './modules/payment/payment.module';

@Module({
  imports: [
    CommonModule,
    ServeStaticModule.forRoot({
      rootPath: join(__dirname, '..', 'public'),
    }),
    DatabaseModule,
    ToolsModule,
    RepositoryMoule,
    WorkflowModule,
    OpenapiModule,
    ScheduleModule.forRoot(),
    CronJobModule,
    ExportModule,
    BootstrapModule,
    AuthModule,
    AssetsModule,
    LLMToolsModule,
    ChatModule,
    PaymentModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(ToolsMiddleware).forRoutes({ path: '/api/system-tools', method: RequestMethod.ALL });
    consumer.apply(ToolsMiddleware).forRoutes({ path: '/api/llm-tool', method: RequestMethod.ALL });
  }
}
