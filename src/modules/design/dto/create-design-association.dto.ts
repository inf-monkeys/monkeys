import { BaseEntityDto } from '@/common/dto/base-entity.dto';
import { I18nValue } from '@inf-monkeys/monkeys';
import { IsBoolean, IsObject, IsOptional, IsString } from 'class-validator';

export class CreateDesignAssociationDto extends BaseEntityDto {
  @IsBoolean()
  enabled: boolean;

  @IsObject()
  displayName: I18nValue;

  @IsOptional()
  @IsObject()
  description?: I18nValue;

  @IsString()
  iconUrl: string;

  @IsString()
  targetWorkflowId: string;

  @IsString()
  targetInputId: string;
}
