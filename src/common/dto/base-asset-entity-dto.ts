import { AssetType, I18nValue } from '@inf-monkeys/monkeys';
import { ApiProperty } from '@nestjs/swagger';
import { AssetPublishConfig } from '../../database/entities/assets/base-asset';
import { BaseEntityDto } from './base-entity.dto';

/* BaseAssetEntity */
export class BaseAssetEntityDto extends BaseEntityDto {
  @ApiProperty({
    description: '资产类型',
  })
  assetType: AssetType;

  @ApiProperty({
    description: '团队ID',
  })
  teamId: string;

  @ApiProperty({
    description: '创建者用户ID',
  })
  creatorUserId: string;

  @ApiProperty({
    description: '图标URL',
    required: false,
  })
  iconUrl?: string;

  @ApiProperty({
    description: '显示名称',
  })
  displayName: string | I18nValue;

  @ApiProperty({
    description: '描述',
    required: false,
  })
  description?: string | I18nValue;

  @ApiProperty({
    description: '是否为预设资产',
    default: false,
  })
  isPreset?: boolean;

  @ApiProperty({
    description: '是否已发布',
    default: false,
  })
  isPublished?: boolean;

  @ApiProperty({
    description: '发布配置',
    required: false,
  })
  publishConfig?: AssetPublishConfig;
}
