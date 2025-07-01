import { BaseAssetEntity } from '@/database/entities/assets/base-asset';
import { AssetType } from '@inf-monkeys/monkeys';
import { Column, Entity, JoinColumn, OneToMany, OneToOne } from 'typeorm';
import { EvaluationBattleEntity } from './evaluation-battle.entity';
import { LeaderboardEntity } from './leaderboard.entity';
import { ModuleEvaluatorEntity } from './module-evaluator.entity';

@Entity('evaluation_modules')
export class EvaluationModuleEntity extends BaseAssetEntity {
  assetType: AssetType = 'leaderboard';

  @Column({ name: 'leaderboard_id', unique: true })
  leaderboardId: string;

  @Column({ name: 'evaluation_criteria', type: 'text', nullable: true })
  evaluationCriteria: string;

  @Column({ name: 'participant_asset_ids', type: 'jsonb', default: () => "'[]'" })
  participantAssetIds: string[];

  @Column({ name: 'is_active', default: true })
  isActive: boolean;

  @OneToOne(() => LeaderboardEntity, { cascade: true })
  @JoinColumn({ name: 'leaderboard_id' })
  leaderboard: LeaderboardEntity;

  @OneToMany(() => ModuleEvaluatorEntity, (moduleEvaluator) => moduleEvaluator.evaluationModule, { cascade: true })
  moduleEvaluators: ModuleEvaluatorEntity[];

  @OneToMany(() => EvaluationBattleEntity, (battle) => battle.evaluationModule)
  battles: EvaluationBattleEntity[];
}
