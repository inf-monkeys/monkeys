import { Column, Entity, JoinColumn, ManyToOne } from 'typeorm';
import { BaseEntity } from '../base/base';
import { ModelTrainingEntity } from './model-training';

@Entity({ name: 'model_training_config_v2' })
export class ModelTrainingConfigV2Entity extends BaseEntity {
  @Column({ name: 'model_training_id', type: 'varchar' })
  modelTrainingId: string;

  @ManyToOne(() => ModelTrainingEntity)
  @JoinColumn({ name: 'model_training_id' })
  modelTraining: ModelTrainingEntity;

  @Column({ name: 'data', type: 'jsonb', nullable: true })
  data: Record<string, any> | null;
}
