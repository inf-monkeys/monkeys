import { Column, Entity, OneToMany, ManyToOne, JoinColumn } from 'typeorm';
import { BaseEntity } from '../base/base';
import { EvaluationBattleEntity } from './evaluation-battle.entity';
import { EvaluationModuleEntity } from './evaluation-module.entity';

export enum BattleStrategy {
  ROUND_ROBIN = 'ROUND_ROBIN',
  RANDOM_PAIRS = 'RANDOM_PAIRS',
}

export enum BattleGroupStatus {
  PENDING = 'PENDING',
  IN_PROGRESS = 'IN_PROGRESS',
  COMPLETED = 'COMPLETED',
  FAILED = 'FAILED',
}

@Entity({ name: 'battle_groups' })
export class BattleGroupEntity extends BaseEntity {
  @Column({ name: 'evaluation_module_id' })
  evaluationModuleId: string;

  @Column({ type: 'jsonb' })
  assetIds: string[];

  @Column({ type: 'enum', enum: BattleStrategy })
  strategy: BattleStrategy;

  @Column({ type: 'int' })
  totalBattles: number;

  @Column({ type: 'int', default: 0 })
  completedBattles: number;

  @Column({ type: 'int', default: 0 })
  failedBattles: number;

  @Column({ type: 'enum', enum: BattleGroupStatus, default: BattleGroupStatus.PENDING })
  status: BattleGroupStatus;

  @Column({ type: 'text', nullable: true })
  description?: string;

  @Column({ type: 'timestamp', nullable: true })
  startedAt?: Date;

  @Column({ type: 'timestamp', nullable: true })
  completedAt?: Date;

  @ManyToOne(() => EvaluationModuleEntity)
  @JoinColumn({ name: 'evaluation_module_id' })
  evaluationModule: EvaluationModuleEntity;

  @OneToMany(() => EvaluationBattleEntity, (battle) => battle.battleGroup)
  battles: EvaluationBattleEntity[];
}
