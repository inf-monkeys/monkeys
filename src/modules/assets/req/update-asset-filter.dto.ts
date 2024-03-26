import { ALLOW_ASSET_TYPES, AssetType } from '@/common/typings/asset';
import { AssetFilterRule } from '@/database/entities/assets/asset-filter';
import * as joiful from 'joiful';

export class UpdateAssetFilterDto {
  @joiful.string()
  name: string;

  @joiful.object()
  rules: AssetFilterRule;

  @joiful.string().allow(ALLOW_ASSET_TYPES).required()
  type: AssetType;
}
