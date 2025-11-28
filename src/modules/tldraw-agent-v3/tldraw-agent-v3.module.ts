import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AgentV3MessageEntity } from '@/database/entities/agent-v3/agent-v3-message.entity';
import { AgentV3SessionEntity } from '@/database/entities/agent-v3/agent-v3-session.entity';
import { TldrawAgentV3BindingEntity } from '@/database/entities/agent-v3/tldraw-agent-v3-binding.entity';
import { MediaFileEntity } from '@/database/entities/assets/media/media-file';
import { AgentV3MessageRepository } from '@/database/repositories/agent-v3-message.repository';
import { AgentV3SessionRepository } from '@/database/repositories/agent-v3-session.repository';
import { TldrawAgentV3BindingRepository } from '@/database/repositories/tldraw-agent-v3-binding.repository';
import { MediaModule } from '@/modules/assets/media/media.module';
import { AgentV3HistoryService } from '../agent-v3/agent-v3.history.service';
import { AgentV3ModelRegistryService } from '../agent-v3/agent-v3.model-registry.service';
import { AgentV3RunLoopService } from '../agent-v3/agent-v3.run-loop.service';
import { TldrawAgentV3Controller } from './tldraw-agent-v3.controller';
import { TldrawAgentV3Service } from './tldraw-agent-v3.service';

@Module({
  imports: [TypeOrmModule.forFeature([TldrawAgentV3BindingEntity, AgentV3SessionEntity, AgentV3MessageEntity, MediaFileEntity]), MediaModule],
  controllers: [TldrawAgentV3Controller],
  providers: [TldrawAgentV3Service, TldrawAgentV3BindingRepository, AgentV3SessionRepository, AgentV3MessageRepository, AgentV3ModelRegistryService, AgentV3HistoryService, AgentV3RunLoopService],
})
export class TldrawAgentV3Module {}
