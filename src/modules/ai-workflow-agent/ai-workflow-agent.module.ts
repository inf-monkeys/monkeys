import { Module } from '@nestjs/common';
import { AiWorkflowAgentService } from './ai-workflow-agent.service';
import { AiWorkflowAgentController } from './ai-workflow-agent.controller';
import { ToolCapabilityAnalyzerService } from './tool-capability-analyzer.service';
import { AiWorkflowBuilderModule } from '../ai-workflow-builder/ai-workflow-builder.module';
import { WorkflowModule } from '../workflow/workflow.module';
import { ToolsModule } from '../tools/tools.module';
import { LLMToolsModule } from '../tools/llm/llm.module';

/**
 * AI 工作流 Agent 模块
 *
 * 功能：
 * - 根据用户目标自动生成并执行工作流
 * - 支持多阶段任务的自动推进
 * - 智能错误处理和重试（Phase 2）
 * - 工具能力感知和参数映射（Phase 3）
 * - SSE 流式响应（Phase 4）
 *
 * 与 AI Workflow Builder 的关系：
 * - AI Workflow Builder: 基础设施，负责生成工作流
 * - AI Workflow Agent: 高级功能，负责自主执行和决策
 */
@Module({
  imports: [
    AiWorkflowBuilderModule,  // 依赖现有的工作流生成器
    WorkflowModule,            // 依赖工作流执行模块
    ToolsModule,               // 依赖工具模块
    LLMToolsModule,            // 依赖 LLM 服务
  ],
  providers: [
    AiWorkflowAgentService,
    ToolCapabilityAnalyzerService,  // Phase 3: 工具能力分析
  ],
  controllers: [AiWorkflowAgentController],
  exports: [AiWorkflowAgentService],
})
export class AiWorkflowAgentModule {}
