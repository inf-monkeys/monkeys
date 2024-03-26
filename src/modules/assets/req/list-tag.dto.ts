import { ALLOW_ASSET_TYPES, AssetType } from '@/common/typings/asset';
import * as joiful from 'joiful';

export class ListTagDto {
  @joiful.string().allow(ALLOW_ASSET_TYPES)
  type: AssetType;

  @joiful.boolean()
  isPresetAsset: boolean;

  @joiful.boolean()
  isPublicAsset: boolean;
}
