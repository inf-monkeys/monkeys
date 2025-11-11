import { BaseAssetEntityDto } from '@/common/dto/base-asset-entity-dto';
import { ApiProperty } from '@nestjs/swagger';
import { IsBoolean, IsNumber, IsOptional } from 'class-validator';

export class CreateDesignProjectDto extends BaseAssetEntityDto {
  @IsNumber()
  sortIndex: number;

  @ApiProperty({
    description: '是否为设计模板',
    default: false,
    required: false,
  })
  @IsBoolean()
  @IsOptional()
  isTemplate?: boolean;
}
