import { Column, Entity, JoinColumn, ManyToOne } from 'typeorm';
import { BaseEntity } from '../base/base';
import { BattleGroupEntity } from './battle-group.entity';
import { EvaluationModuleEntity } from './evaluation-module.entity';
import { EvaluatorEntity } from './evaluator.entity';

export enum BattleResult {
  A_WIN = 'A_WIN',
  B_WIN = 'B_WIN',
  DRAW = 'DRAW',
}

@Entity({ name: 'evaluation_battles' })
export class EvaluationBattleEntity extends BaseEntity {
  @Column({ name: 'evaluation_module_id' })
  evaluationModuleId: string;

  @Column({ name: 'battle_group_id', nullable: true })
  battleGroupId?: string;

  @Column({ name: 'asset_a_id' })
  assetAId: string;

  @Column({ name: 'asset_b_id' })
  assetBId: string;

  @Column({ type: 'varchar', nullable: true })
  winnerId?: string;

  @Column({ type: 'enum', enum: BattleResult, nullable: true })
  result?: BattleResult;

  @Column({ name: 'evaluator_id', nullable: true })
  evaluatorId?: string;

  @Column({ type: 'text', nullable: true })
  reason?: string;

  @Column({ name: 'completed_at', type: 'timestamp', nullable: true })
  completedAt?: Date;

  @ManyToOne(() => EvaluationModuleEntity, (module) => module.battles)
  @JoinColumn({ name: 'evaluation_module_id' })
  evaluationModule: EvaluationModuleEntity;

  @ManyToOne(() => EvaluatorEntity, (evaluator) => evaluator.battles, { nullable: true })
  @JoinColumn({ name: 'evaluator_id' })
  evaluator?: EvaluatorEntity;

  @ManyToOne(() => BattleGroupEntity, (group) => group.battles, { nullable: true })
  @JoinColumn({ name: 'battle_group_id' })
  battleGroup?: BattleGroupEntity;
}
