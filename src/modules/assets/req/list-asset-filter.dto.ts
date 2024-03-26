import { ALLOW_ASSET_TYPES, AssetType } from '@/common/typings/asset';
import * as joiful from 'joiful';

export class ListAssetFilterDto {
  @joiful.string().allow(ALLOW_ASSET_TYPES)
  type: AssetType;
}
