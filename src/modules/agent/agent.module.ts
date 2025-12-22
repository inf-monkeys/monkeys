import { Module, forwardRef } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CacheModule } from '@nestjs/cache-manager';
import { EventEmitterModule } from '@nestjs/event-emitter';
import { AgentEntity } from '@/database/entities/agents/agent.entity';
import { ThreadEntity } from '@/database/entities/agents/thread.entity';
import { MessageEntity } from '@/database/entities/agents/message.entity';
import { ToolEntity } from '@/database/entities/agents/tool.entity';
import { ToolCallEntity } from '@/database/entities/agents/tool-call.entity';
import { TeamQuotaEntity } from '@/database/entities/identity/team-quota';
import { AgentController } from './agent.controller';
import { AgentService } from './services/agent.service';
import { ThreadService } from './services/thread.service';
import { MessageService } from './services/message.service';
import { StreamingService } from './services/streaming.service';
import { ModelRegistryService } from './services/model-registry.service';
import { AgentQuotaService } from './services/agent-quota.service';
import { AgentToolRegistryService } from './services/agent-tool-registry.service';
import { AgentToolExecutorService } from './services/agent-tool-executor.service';
import { CanvasContextService } from './services/canvas-context.service';
import { RelationshipDiscoveryService } from './services/relationship-discovery.service';
import { CreativeStateAnalysisService } from './services/creative-state-analysis.service';
import { InspirationPushService } from './services/inspiration-push.service';
import { MindMapGenerationService } from './services/mind-map-generation.service';
import { MindMapInsightService } from './services/mind-map-insight.service';
import { AgentRepository } from './repositories/agent.repository';
import { ThreadRepository } from './repositories/thread.repository';
import { MessageRepository } from './repositories/message.repository';
import { ToolCallRepository } from './repositories/tool-call.repository';
import { ToolRepository } from './repositories/tool.repository';
import { TeamQuotaRepository } from './repositories/team-quota.repository';
import { ToolsModule } from '@/modules/tools/tools.module';
import { WorkflowModule } from '@/modules/workflow/workflow.module';
import { DesignModule } from '@/modules/design/design.module';

/**
 * Agent 模块
 *
 * **功能**：
 * - Agent 管理（CRUD）
 * - Thread 管理（对话会话）
 * - Message 管理（消息历史）
 * - 流式对话（AI SDK v6）
 * - 模型注册（多 provider 支持）
 * - 工具调用执行引擎
 * - HITL 审批流程
 * - 团队配额和并发控制
 * - Canvas 上下文支持（tldraw集成）
 * - 关系发现（图形逻辑关系分析）
 * - 创作状态分析与灵感推送
 */
@Module({
  imports: [
    TypeOrmModule.forFeature([
      AgentEntity,
      ThreadEntity,
      MessageEntity,
      ToolEntity,
      ToolCallEntity,
      TeamQuotaEntity,
    ]),
    ToolsModule,
    forwardRef(() => WorkflowModule), // 使用 forwardRef 避免循环依赖
    forwardRef(() => DesignModule), // 导入 DesignModule 用于画板数据操作
    CacheModule.register({
      ttl: 3600000, // 1 hour default TTL
      max: 1000, // Maximum number of items in cache
    }),
    EventEmitterModule.forRoot(),
  ],
  controllers: [AgentController],
  providers: [
    // Core Services
    AgentService,
    ThreadService,
    MessageService,
    StreamingService,
    ModelRegistryService,

    // Tool Calling Services
    AgentQuotaService,
    AgentToolRegistryService,
    AgentToolExecutorService,

    // Canvas Context
    CanvasContextService,

    // Relationship Discovery
    RelationshipDiscoveryService,

    // Mind Map Generation & Insight
    MindMapGenerationService,
    MindMapInsightService,

    // Creative State Analysis & Inspiration Push
    CreativeStateAnalysisService,
    InspirationPushService,

    // Repositories
    AgentRepository,
    ThreadRepository,
    MessageRepository,
    ToolCallRepository,
    ToolRepository,
    TeamQuotaRepository,
  ],
  exports: [
    AgentService,
    ThreadService,
    MessageService,
    StreamingService,
    ModelRegistryService,
    AgentToolExecutorService,
    CanvasContextService,
  ],
})
export class AgentModule {}
