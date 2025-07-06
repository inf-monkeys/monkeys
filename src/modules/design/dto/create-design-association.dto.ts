import { BaseAssetEntityDto } from '@/common/dto/base-asset-entity-dto';
import { IsBoolean, IsString } from 'class-validator';

export class CreateDesignAssociationDto extends BaseAssetEntityDto {
  @IsBoolean()
  enabled: boolean;

  @IsString()
  targetWorkflowId: string;

  @IsString()
  targetInputId: string;
}
