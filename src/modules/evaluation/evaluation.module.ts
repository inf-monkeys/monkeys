import { BattleGroupEntity } from '@/database/entities/evaluation/battle-group.entity';
import { EvaluationBattleEntity } from '@/database/entities/evaluation/evaluation-battle.entity';
import { EvaluationModuleEntity } from '@/database/entities/evaluation/evaluation-module.entity';
import { EvaluationRatingHistoryEntity } from '@/database/entities/evaluation/evaluation-rating-history.entity';
import { EvaluationTaskEntity } from '@/database/entities/evaluation/evaluation-task.entity';
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
import { AutoEvaluationService } from './services/auto-evaluation.service';
import { OpenSkillService } from './services/openskill.service';
import { PgTaskProcessorService } from './services/pg-task-processor.service';
import { PgTaskQueueService } from './services/pg-task-queue.service';
import { SmartConvergenceService } from './services/smart-convergence.service';

@Module({
  controllers: [EvaluationController],
  providers: [EvaluationService, BattleStrategyService, LlmService, MediaFileService, PgTaskQueueService, PgTaskProcessorService, OpenSkillService, AutoEvaluationService, SmartConvergenceService],
  imports: [
    TypeOrmModule.forFeature([LeaderboardEntity, EvaluationBattleEntity, BattleGroupEntity, LeaderboardScoreEntity, EvaluationRatingHistoryEntity, EvaluationModuleEntity, EvaluationTaskEntity]),
    RepositoryMoule,
    ToolsModule,
    KnowledgeBaseModule,
    SqlKnowledgeBaseModule,
    forwardRef(() => MediaModule),
  ],
  exports: [EvaluationService, PgTaskQueueService, PgTaskProcessorService, OpenSkillService],
})
export class EvaluationModule {}
