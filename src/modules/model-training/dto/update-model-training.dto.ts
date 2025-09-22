import { I18nValue } from '@inf-monkeys/monkeys';
import { PartialType } from '@nestjs/swagger';
import { IsJSON, IsOptional } from 'class-validator';
import { CreateModelTrainingDto } from './create-model-training.dto';

export class UpdateModelTrainingDto extends PartialType(CreateModelTrainingDto) {
  @IsJSON()
  @IsOptional()
  displayName?: I18nValue;
}
