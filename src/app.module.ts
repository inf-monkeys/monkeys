import { TranslateToolsModule } from '@/modules/tools/translate/translate.module';
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
import { AgentV2Module } from './modules/agent-v2/agent-v2.module';
import { AgentV3Module } from './modules/agent-v3/agent-v3.module';
import { AiWorkflowBuilderModule } from './modules/ai-workflow-builder/ai-workflow-builder.module';
import { AssetsModule } from './modules/assets/assets.module';
import { AuthModule } from './modules/auth/auth.module';
import { BootstrapModule } from './modules/bootstrap/bootstrap.module';
import { ChatModule } from './modules/chat/chat.module';
import { DesignModule } from './modules/design/design.module';
import { EvaluationModule } from './modules/evaluation/evaluation.module';
import { ExportModule } from './modules/export/export.module';
import { FalModule } from './modules/fal/fal.module';
import { MarketplaceModule } from './modules/marketplace/marketplace.module';
import { ModelTrainingModule } from './modules/model-training/model-training.module';
import { PaymentModule } from './modules/payment/payment.module';
import { SttModule } from './modules/stt/stt.module';
import { TemporaryWorkflowModule } from './modules/temporary-workflow/temporary-workflow.module';
import { TenantModule } from './modules/tenant/tenant.module';
import { TldrawAgentV2Module } from './modules/tldraw-agent-v2/tldraw-agent-v2.module';
import { TldrawAgentModule } from './modules/tldraw-agent/tldraw-agent.module';
import { TldrawAgentV3Module } from './modules/tldraw-agent-v3/tldraw-agent-v3.module';
import { LLMToolsModule } from './modules/tools/llm/llm.module';
import { MediaToolsModule } from './modules/tools/media/media.module';
import { ToolsModule } from './modules/tools/tools.module';
import { WorkflowModule } from './modules/workflow/workflow.module';
import { OpenapiModule } from './openapi.module';
import { PrometheusModule } from './prometheus/prometheus.module';

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
    AgentV2Module,
    AgentV3Module,
    AiWorkflowBuilderModule,
    OpenapiModule,
    ScheduleModule.forRoot(),
    CronJobModule,
    ExportModule,
    BootstrapModule,
    AuthModule,
    AssetsModule,
    LLMToolsModule,
    TranslateToolsModule,
    MediaToolsModule,
    ChatModule,
    PaymentModule,
    PrometheusModule.register({
      path: '/metrics',
      defaultLabels: {
        app: 'Monkeys Server',
      },
    }),
    DesignModule,
    TenantModule,
    TemporaryWorkflowModule,
    MarketplaceModule,
    EvaluationModule,
    ModelTrainingModule,
    TldrawAgentModule,
    TldrawAgentV2Module,
    TldrawAgentV3Module,
    FalModule,
    SttModule,
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
