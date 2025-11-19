import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AgentV3SessionEntity } from '@/database/entities/agent-v3/agent-v3-session.entity';
import { AgentV3MessageEntity } from '@/database/entities/agent-v3/agent-v3-message.entity';
import { AgentV3SessionRepository } from '@/database/repositories/agent-v3-session.repository';
import { AgentV3MessageRepository } from '@/database/repositories/agent-v3-message.repository';
import { MediaFileEntity } from '@/database/entities/assets/media/media-file';
import { MediaFileRepository } from '@/database/repositories/media.repository';
import { MediaFileService } from '@/modules/assets/media/media.service';
import { MediaModule } from '@/modules/assets/media/media.module';
import { AgentV3ModelRegistryService } from './agent-v3.model-registry.service';
import { AgentV3HistoryService } from './agent-v3.history.service';
import { AgentV3RunLoopService } from './agent-v3.run-loop.service';
import { AgentV3Controller } from './agent-v3.controller';
import { ToolsModule } from '../tools/tools.module';

@Module({
  imports: [TypeOrmModule.forFeature([AgentV3SessionEntity, AgentV3MessageEntity, MediaFileEntity]), ToolsModule, MediaModule],
  providers: [AgentV3SessionRepository, AgentV3MessageRepository, MediaFileRepository, MediaFileService, AgentV3ModelRegistryService, AgentV3HistoryService, AgentV3RunLoopService],
  controllers: [AgentV3Controller],
})
export class AgentV3Module {}
