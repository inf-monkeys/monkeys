import { BaseEntity } from '@/database/entities/base/base';
import { EvaluationModuleEntity } from './evaluation-module.entity';
import { EvaluatorEntity } from './evaluator.entity';
import { Column, Entity, ManyToOne, JoinColumn, Index } from 'typeorm';

@Entity('module_evaluators')
@Index(['evaluationModuleId', 'evaluatorId'], { unique: true })
export class ModuleEvaluatorEntity extends BaseEntity {
  @Column({ name: 'evaluation_module_id' })
  evaluationModuleId: string;

  @Column({ name: 'evaluator_id' })
  evaluatorId: string;

  @Column({ type: 'decimal', precision: 3, scale: 2, default: 1.0 })
  weight: number;

  @Column({ name: 'is_active', default: true })
  isActive: boolean;

  @ManyToOne(() => EvaluationModuleEntity, (module) => module.moduleEvaluators)
  @JoinColumn({ name: 'evaluation_module_id' })
  evaluationModule: EvaluationModuleEntity;

  @ManyToOne(() => EvaluatorEntity, (evaluator) => evaluator.moduleEvaluators)
  @JoinColumn({ name: 'evaluator_id' })
  evaluator: EvaluatorEntity;
}
