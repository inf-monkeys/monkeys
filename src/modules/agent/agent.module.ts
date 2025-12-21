import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AgentEntity } from '@/database/entities/agents/agent.entity';
import { ThreadEntity } from '@/database/entities/agents/thread.entity';
import { MessageEntity } from '@/database/entities/agents/message.entity';
import { ToolEntity } from '@/database/entities/agents/tool.entity';
import { ToolCallEntity } from '@/database/entities/agents/tool-call.entity';
import { AgentController } from './agent.controller';
import { AgentService } from './services/agent.service';
import { ThreadService } from './services/thread.service';
import { MessageService } from './services/message.service';
import { StreamingService } from './services/streaming.service';
import { ModelRegistryService } from './services/model-registry.service';
import { AgentRepository } from './repositories/agent.repository';
import { ThreadRepository } from './repositories/thread.repository';
import { MessageRepository } from './repositories/message.repository';

/**
 * Agent 模块
 *
 * **功能**：
 * - Agent 管理（CRUD）
 * - Thread 管理（对话会话）
 * - Message 管理（消息历史）
 * - 流式对话（AI SDK v6）
 * - 模型注册（多 provider 支持）
 */
@Module({
  imports: [
    TypeOrmModule.forFeature([AgentEntity, ThreadEntity, MessageEntity, ToolEntity, ToolCallEntity]),
  ],
  controllers: [AgentController],
  providers: [
    // Services
    AgentService,
    ThreadService,
    MessageService,
    StreamingService,
    ModelRegistryService,

    // Repositories
    AgentRepository,
    ThreadRepository,
    MessageRepository,
  ],
  exports: [AgentService, ThreadService, MessageService, StreamingService, ModelRegistryService],
})
export class AgentModule {}
