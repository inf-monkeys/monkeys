import { ALLOW_ASSET_TYPES, AssetType } from '@/common/typings/asset';
import { AssetFilterRule } from '@/database/entities/assets/asset-filter';
import * as joiful from 'joiful';

export class CreateAssetFilterDto {
  @joiful.string()
  name: string;

  @joiful.object().optional()
  rules?: AssetFilterRule;

  @joiful.string().allow(ALLOW_ASSET_TYPES).required()
  type: AssetType;
}
