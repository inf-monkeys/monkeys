import { BaseEntityDto } from '@/common/dto/base-entity.dto';
import { IsBoolean, IsNotEmpty, IsObject, IsOptional, IsString } from 'class-validator';

export class CreateDesignMetadataDto extends BaseEntityDto {
  @IsString()
  @IsNotEmpty()
  designProjectId: string;

  @IsString()
  @IsNotEmpty()
  displayName: string;

  @IsObject()
  @IsOptional()
  snapshot?: Record<string, any>;

  @IsBoolean()
  @IsNotEmpty()
  pinned: boolean;

  @IsString()
  @IsNotEmpty()
  teamId: string;

  @IsString()
  @IsOptional()
  thumbnailUrl?: string;
}
