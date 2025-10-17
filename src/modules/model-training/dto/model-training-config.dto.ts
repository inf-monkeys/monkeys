import { BaseEntityDto } from '@/common/dto/base-entity.dto';
import { PartialType } from '@nestjs/swagger';
import { IsInt, IsOptional, IsString } from 'class-validator';

export class CreateModelTrainingConfigDto extends BaseEntityDto {
  @IsString()
  modelTrainingId: string;

  @IsString()
  @IsOptional()
  feishuTableUrl?: string;

  @IsString()
  @IsOptional()
  feishuImageNameColumn?: string;

  @IsString()
  @IsOptional()
  feishuPromptColumn?: string;

  @IsString()
  @IsOptional()
  feishuImageColumn?: string;

  @IsString()
  @IsOptional()
  fileStorageId?: string;

  @IsString()
  @IsOptional()
  learningRate?: string;

  @IsString()
  @IsOptional()
  modelName?: string;

  @IsString()
  @IsOptional()
  modelTrainingType?: string;

  @IsInt()
  @IsOptional()
  maxTrainEpochs?: number;

  @IsInt()
  @IsOptional()
  trainBatchSize?: number;

  @IsInt()
  @IsOptional()
  saveEveryNEpochs?: number;

  @IsString()
  @IsOptional()
  feishuTestTableUrl?: string;

  @IsString()
  @IsOptional()
  modelPathPrefix?: string;
}

export class UpdateModelTrainingConfigDto extends PartialType(CreateModelTrainingConfigDto) {
  @IsString()
  @IsOptional()
  modelTrainingId?: string;
}
