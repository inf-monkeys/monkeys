import { Column, Entity, JoinColumn, OneToOne } from 'typeorm';
import { BaseEntity } from '../base/base';
import { ModelTrainingEntity } from './model-training';

@Entity({ name: 'model_training_config' })
export class ModelTrainingConfigEntity extends BaseEntity {
  @Column({ name: 'model_training_id', type: 'varchar' })
  modelTrainingId: string;

  @OneToOne(() => ModelTrainingEntity)
  @JoinColumn({ name: 'model_training_id' })
  modelTraining: ModelTrainingEntity;

  @Column({ name: 'feishu_table_url', type: 'varchar' })
  feishuTableUrl: string;

  @Column({ name: 'feishu_image_name_column', type: 'varchar' })
  feishuImageNameColumn: string;

  @Column({ name: 'feishu_prompt_column', type: 'varchar' })
  feishuPromptColumn: string;

  @Column({ name: 'feishu_image_column', type: 'varchar' })
  feishuImageColumn: string;

  @Column({ name: 'file_storage_id', type: 'varchar' })
  fileStorageId: string;

  @Column({ name: 'learning_rate', type: 'varchar' })
  learningRate: string;

  @Column({ name: 'model_name', type: 'varchar' })
  modelName: string;

  @Column({ name: 'model_training_type', type: 'varchar' })
  modelTrainingType: string;

  @Column({ name: 'max_train_epochs', type: 'int' })
  maxTrainEpochs: number;

  @Column({ name: 'train_batch_size', type: 'int' })
  trainBatchSize: number;

  @Column({ name: 'save_every_n_epochs', type: 'int' })
  saveEveryNEpochs: number;

  @Column({ name: 'feishu_test_table_url', type: 'varchar' })
  feishuTestTableUrl: string;

  @Column({ name: 'model_path_prefix', type: 'varchar' })
  modelPathPrefix: string;
}
