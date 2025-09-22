import { BaseAssetEntityDto } from '@/common/dto/base-asset-entity-dto';
import { ModelTrainingStatus } from '@/database/entities/model-training/model-training';
import { I18nValue } from '@inf-monkeys/monkeys';
import { IsEnum, IsJSON, IsOptional } from 'class-validator';

export class CreateModelTrainingDto extends BaseAssetEntityDto {
  @IsJSON()
  @IsOptional()
  displayName: I18nValue;

  @IsJSON()
  @IsOptional()
  description?: I18nValue;

  @IsEnum(ModelTrainingStatus)
  @IsOptional()
  status?: ModelTrainingStatus;
}
