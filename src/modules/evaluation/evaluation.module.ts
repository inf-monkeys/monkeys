import { BattleGroupEntity } from '@/database/entities/evaluation/battle-group.entity';
import { EvaluationBattleEntity } from '@/database/entities/evaluation/evaluation-battle.entity';
import { LeaderboardScoreEntity } from '@/database/entities/evaluation/leaderboard-score.entity';
import { LeaderboardEntity } from '@/database/entities/evaluation/leaderboard.entity';
import { RepositoryMoule } from '@/database/repositories.module';
import { MediaFileService } from '@/modules/assets/media/media.service';
import { LlmService } from '@/modules/tools/llm/llm.service';
import { forwardRef, Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { KnowledgeBaseModule } from '../assets/knowledge-base/knowledge-base.module';
import { MediaModule } from '../assets/media/media.module';
import { SqlKnowledgeBaseModule } from '../assets/sql-knowledge-base/sql-knowledge-base.module';
import { ToolsModule } from '../tools/tools.module';
import { BattleStrategyService } from './battle-strategy.service';
import { EvaluationController } from './evaluation.controller';
import { EvaluationService } from './evaluation.service';
import { TaskProcessorService } from './services/task-processor.service';
import { TaskProgressService } from './services/task-progress.service';
import { TaskQueueService } from './services/task-queue.service';
import { EvaluationSseController } from './sse/evaluation-sse.controller';

@Module({
  controllers: [EvaluationController, EvaluationSseController],
  providers: [EvaluationService, BattleStrategyService, LlmService, MediaFileService, TaskQueueService, TaskProgressService, TaskProcessorService],
  imports: [
    TypeOrmModule.forFeature([LeaderboardEntity, EvaluationBattleEntity, BattleGroupEntity, LeaderboardScoreEntity]),
    RepositoryMoule,
    ToolsModule,
    KnowledgeBaseModule,
    SqlKnowledgeBaseModule,
    forwardRef(() => MediaModule),
  ],
  exports: [EvaluationService, TaskQueueService, TaskProgressService, TaskProcessorService],
})
export class EvaluationModule {}
