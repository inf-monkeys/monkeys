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
import { AgentRepository } from './repositories/agent.repository';
import { ThreadRepository } from './repositories/thread.repository';
import { MessageRepository } from './repositories/message.repository';
import { ToolCallRepository } from './repositories/tool-call.repository';
import { ToolRepository } from './repositories/tool.repository';
import { TeamQuotaRepository } from './repositories/team-quota.repository';
import { ToolsModule } from '@/modules/tools/tools.module';
import { WorkflowModule } from '@/modules/workflow/workflow.module';

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
  ],
})
export class AgentModule {}
