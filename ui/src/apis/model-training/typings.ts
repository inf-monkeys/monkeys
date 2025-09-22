import { I18nValue } from '@inf-monkeys/monkeys';

export enum ModelTrainingStatus {
  IDLE = 'idle',
  PENDING = 'pending',
  RUNNING = 'running',
  COMPLETED = 'completed',
  FAILED = 'failed',
}

export interface IModelTraining {
  id: string;
  displayName: string | I18nValue;
  description?: string | I18nValue;
  createdTimestamp: number;
  updatedTimestamp: number;
  status: ModelTrainingStatus;
}
