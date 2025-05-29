import { BaseAssetEntityDto } from '@/common/dto/base-asset-entity-dto';
import { IsNumber } from 'class-validator';

export class CreateDesignProjectDto extends BaseAssetEntityDto {
  @IsNumber()
  sortIndex: number;
}
