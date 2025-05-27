import { BaseAssetEntityDto } from '@/common/dto/base-asset-entity-dto';
import { IsNotEmpty, IsNumber } from 'class-validator';

export class CreateDesignProjectDto extends BaseAssetEntityDto {
  @IsNumber()
  @IsNotEmpty()
  sortIndex: number;
}
