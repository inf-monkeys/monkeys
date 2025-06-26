import { BaseEntity } from '@/database/entities/base/base';
import { ModuleEvaluatorEntity } from './module-evaluator.entity';
import { EvaluationBattleEntity } from './evaluation-battle.entity';
import { Column, Entity, OneToMany } from 'typeorm';

export enum EvaluatorType {
  LLM = 'llm',
  HUMAN = 'human',
}

@Entity('evaluators')
export class EvaluatorEntity extends BaseEntity {
  @Column({ length: 255 })
  name: string;

  @Column({ type: 'enum', enum: EvaluatorType })
  type: EvaluatorType;

  @Column({ name: 'llm_model_name', length: 255, nullable: true })
  llmModelName?: string;

  @Column({ name: 'evaluation_focus', type: 'text', nullable: true })
  evaluationFocus?: string;

  @Column({ name: 'human_user_id', nullable: true })
  humanUserId?: string;

  @Column({ name: 'is_active', default: true })
  isActive: boolean;

  @Column({ type: 'jsonb', nullable: true })
  config: Record<string, any>;

  @OneToMany(() => ModuleEvaluatorEntity, (moduleEvaluator) => moduleEvaluator.evaluator)
  moduleEvaluators: ModuleEvaluatorEntity[];

  @OneToMany(() => EvaluationBattleEntity, (battle) => battle.evaluator)
  battles: EvaluationBattleEntity[];
}
