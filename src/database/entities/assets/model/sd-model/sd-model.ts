import { BaseAssetEntity } from '@/database/entities/assets/base-asset';
import { Column, Entity } from 'typeorm';

export enum SdWorkProcessStatus {
  PENDING = 0,
  CONVERTING = 1,
  FINISHED = 2,
  FAIL = 3,
}

export type SdModelType = 'Checkpoint' | 'Lora' | 'Embedding' | 'VAE';

export interface XYZTestResult {
  error?: string;
  x: { name: string; value: string[] };
  y: { name: string; value: string[] };
  items: { x: string; y: string; href: string; prompt: string }[][];
}

@Entity({ name: 'sd_models' })
export class SdModelEntity extends BaseAssetEntity {
  @Column({
    type: 'varchar',
  })
  status: SdWorkProcessStatus;

  @Column({
    nullable: true,
  })
  progress: number;

  @Column()
  md5: string;

  @Column({
    name: 'model_id',
  })
  modelId: string;

  @Column()
  keywords: string;

  @Column({
    type: 'simple-json',
  })
  images: string[];

  @Column({
    type: 'simple-json',
  })
  params: Record<string, any>;

  @Column({
    type: 'varchar',
    nullable: true,
  })
  type?: SdModelType;

  @Column({
    type: 'varchar',
    name: 'base_model',
  })
  baseModel: 'SD 1' | 'SD 2' | 'SDXL';

  @Column({
    name: 'model_format',
    nullable: true,
  })
  modelFormat?: 'ckpt' | 'safetensors' = 'ckpt';

  @Column({
    name: 'disable_text_to_image',
    nullable: true,
  })
  disableTextToImage?: boolean = false;

  @Column({
    name: 'disable_image_to_image',
    nullable: true,
  })
  disableImageToImage?: boolean = false;

  @Column({
    name: 'disable_fine_tune',
    nullable: true,
  })
  disableFineTune?: boolean = false;

  @Column({
    name: 'output_models',
    nullable: true,
    type: 'simple-json',
  })
  outputModels?: string[];

  @Column({
    name: 'output_samples',
    nullable: true,
    type: 'simple-json',
  })
  outputSamples?: string[];

  @Column({
    name: 'output_logs',
    nullable: true,
    type: 'simple-json',
  })
  outputLogs?: [];

  @Column({
    name: 'output_xyz_test',
    nullable: true,
    type: 'simple-json',
  })
  outputXYZTest?: XYZTestResult;

  @Column({
    type: 'varchar',
    nullable: true,
  })
  version?: string;

  @Column({
    type: 'varchar',
    nullable: true,
    name: 'civitai_url',
  })
  civitaiUrl?: string;

  @Column({
    nullable: true,
    type: 'simple-json',
  })
  tags: string[];
}
