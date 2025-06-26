import { AssetType } from '@inf-monkeys/monkeys';
import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsArray, IsEnum, IsNotEmpty, IsNumber, IsOptional, IsString, ValidateNested } from 'class-validator';

class AssetReferenceDto {
  @ApiProperty({ description: 'Type of the asset', enum: ['workflow'] })
  @IsEnum(['workflow'])
  assetType: AssetType;

  @ApiProperty({ description: 'Original ID of the asset' })
  @IsString()
  @IsNotEmpty()
  assetId: string;

  @ApiProperty({ description: 'Version of the asset' })
  @IsNumber()
  version: number;
}

export class AppMetadataDto {
  @ApiProperty({ description: 'Name of the application' })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiProperty({ description: 'Description of the application', required: false })
  @IsString()
  @IsOptional()
  description?: string;

  @ApiProperty({ description: 'Icon URL for the application', required: false })
  @IsString()
  @IsOptional()
  iconUrl?: string;

  @ApiProperty({ description: 'Primary asset type of the application', enum: ['workflow'] })
  @IsEnum(['workflow'])
  assetType: AssetType;

  @ApiProperty({ description: 'Categories for the application', required: false, isArray: true })
  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  categories?: string[];
}

export class AppVersionDto {
  @ApiProperty({ description: 'A semantic version string for the new version' })
  @IsString()
  @IsNotEmpty()
  version: string;

  @ApiProperty({ description: 'Release notes for this version', required: false })
  @IsString()
  @IsOptional()
  releaseNotes?: string;

  @ApiProperty({ type: [AssetReferenceDto], description: 'List of assets to include in this version' })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => AssetReferenceDto)
  assets: AssetReferenceDto[];
}

export class CreateMarketplaceAppWithVersionDto {
  @ApiProperty({ description: 'Application metadata' })
  @ValidateNested()
  @Type(() => AppMetadataDto)
  app: AppMetadataDto;

  @ApiProperty({ description: 'Version information' })
  @ValidateNested()
  @Type(() => AppVersionDto)
  version: AppVersionDto;
}
