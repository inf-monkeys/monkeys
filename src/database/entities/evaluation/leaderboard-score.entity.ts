import { Column, Entity, Index, JoinColumn, ManyToOne } from 'typeorm';
import { BaseEntity } from '../base/base';
import { EvaluationModuleEntity } from './evaluation-module.entity';

export interface ScoreRecord {
  rating: number;
  rd: number;
  vol: number;
}

@Entity({ name: 'leaderboard_scores' })
@Index(['evaluationModuleId', 'assetId'], { unique: true })
export class LeaderboardScoreEntity extends BaseEntity {
  @Column({ name: 'evaluation_module_id' })
  evaluationModuleId: string;

  @Column({ name: 'asset_id' })
  assetId: string;

  @Column({ type: 'jsonb', name: 'scores_by_evaluator', default: () => "'{}'" })
  scoresByEvaluator: Record<string, ScoreRecord>;

  @Column({ type: 'int', default: 0 })
  gamesPlayed: number;

  @ManyToOne(() => EvaluationModuleEntity)
  @JoinColumn({ name: 'evaluation_module_id' })
  evaluationModule: EvaluationModuleEntity;
}
