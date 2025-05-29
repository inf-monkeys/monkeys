import { BaseEntityDto } from '@/common/dto/base-entity.dto';
import { IsBoolean, IsNotEmpty, IsObject, IsString } from 'class-validator';

export class CreateDesignMetadataDto extends BaseEntityDto {
  @IsString()
  @IsNotEmpty()
  designProjectId: string;

  @IsString()
  @IsNotEmpty()
  displayName: string;

  @IsObject()
  @IsNotEmpty()
  snapshot: Record<string, any>;

  @IsBoolean()
  @IsNotEmpty()
  pinned: boolean;

  @IsString()
  @IsNotEmpty()
  teamId: string;
}
