import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AgentV2MessageEntity } from 'src/database/entities/agent-v2/agent-v2-message.entity';
import { AgentV2SessionEntity } from 'src/database/entities/agent-v2/agent-v2-session.entity';
import { AgentV2MessageQueueEntity, AgentV2TaskStateEntity } from 'src/database/entities/agent-v2/agent-v2-task-state.entity';
import { AgentV2Entity } from 'src/database/entities/agent-v2/agent-v2.entity';
import { ToolsModule } from '../tools/tools.module';
import { AgentV2Controller } from './agent-v2.controller';
import { AgentV2LlmService } from './services/agent-v2-llm.service';
import { AgentV2PersistentTaskManager } from './services/agent-v2-persistent-task-manager.service';
import { AgentV2TaskStateManager } from './services/agent-v2-task-state-manager.service';
import { AgentV2Repository } from './services/agent-v2.repository';
import { AgentV2Service } from './services/agent-v2.service';
import { AgentV2McpService } from './services/mcp/agent-v2-mcp.service';
import { AgentV2ToolsService } from './services/tools/agent-v2-tools.service';

@Module({
  imports: [TypeOrmModule.forFeature([AgentV2Entity, AgentV2SessionEntity, AgentV2MessageEntity, AgentV2TaskStateEntity, AgentV2MessageQueueEntity]), ToolsModule],
  controllers: [AgentV2Controller],
  providers: [AgentV2Service, AgentV2Repository, AgentV2LlmService, AgentV2ToolsService, AgentV2McpService, AgentV2PersistentTaskManager, AgentV2TaskStateManager],
  exports: [AgentV2Service],
})
export class AgentV2Module {}
