import { Column, Entity, Index, JoinColumn, ManyToOne } from 'typeorm';
import { BaseEntity } from '../base/base';
import { EvaluationModuleEntity } from './evaluation-module.entity';

@Entity({ name: 'leaderboard_scores' })
@Index(['evaluationModuleId', 'assetId'], { unique: true })
@Index(['evaluationModuleId', 'totalBattles']) // 优化按对战数量排序
@Index(['evaluationModuleId', 'wins']) // 优化按胜利数排序
export class LeaderboardScoreEntity extends BaseEntity {
  @Column({ name: 'evaluation_module_id' })
  evaluationModuleId: string;

  @Column({ name: 'asset_id' })
  assetId: string;

  @Column({ type: 'int', default: 0 })
  gamesPlayed: number;

  @Column({ type: 'int', default: 0 })
  wins: number;

  @Column({ type: 'int', default: 0 })
  losses: number;

  @Column({ type: 'int', default: 0 })
  draws: number;

  @Column({ type: 'int', default: 0 })
  totalBattles: number;

  @ManyToOne(() => EvaluationModuleEntity)
  @JoinColumn({ name: 'evaluation_module_id' })
  evaluationModule: EvaluationModuleEntity;
}
