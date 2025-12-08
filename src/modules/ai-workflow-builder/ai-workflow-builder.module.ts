import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AiWorkflowBuilderController } from './ai-workflow-builder.controller';
import { AiWorkflowBuilderService } from './ai-workflow-builder.service';
import { ToolsCatalogService } from './tools-catalog.service';
import { PromptBuilderService } from './prompt-builder.service';
import { WorkflowValidatorService } from './workflow-validator.service';
import { SmartRouterService } from './smart-router.service';
import { ToolsEntity } from '@/database/entities/tools/tools.entity';
import { LLMToolsModule } from '../tools/llm/llm.module';
import { WorkflowModule } from '../workflow/workflow.module';

/**
 * AI 工作流生成器模块
 */
@Module({
  imports: [
    TypeOrmModule.forFeature([ToolsEntity]),
    LLMToolsModule, // 提供 LlmService
    WorkflowModule, // 提供 WorkflowCrudService 和 WorkflowValidateService
  ],
  controllers: [AiWorkflowBuilderController],
  providers: [AiWorkflowBuilderService, ToolsCatalogService, PromptBuilderService, WorkflowValidatorService, SmartRouterService],
  exports: [AiWorkflowBuilderService],
})
export class AiWorkflowBuilderModule {}
