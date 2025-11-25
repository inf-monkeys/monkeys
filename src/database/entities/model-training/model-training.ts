import { I18nValue } from '@inf-monkeys/monkeys';
import { Column, Entity } from 'typeorm';
import { BaseEntity } from '../base/base';

export enum ModelTrainingStatus {
  IDLE = 'idle',
  PENDING = 'pending',
  RUNNING = 'running',
  COMPLETED = 'completed',
  FAILED = 'failed',
}

@Entity({ name: 'model_training' })
export class ModelTrainingEntity extends BaseEntity {
  @Column({ name: 'team_id', type: 'varchar' })
  teamId: string;

  @Column({ name: 'display_name', type: 'jsonb' })
  displayName: I18nValue;

  @Column({ name: 'description', type: 'jsonb', nullable: true })
  description?: I18nValue;

  @Column({ name: 'status', type: 'enum', enum: ModelTrainingStatus })
  status: ModelTrainingStatus;

  @Column({ name: 'version_type', type: 'int', default: 1 })
  versionType: number;
}
