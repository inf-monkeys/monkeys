import { ALLOW_ASSET_TYPES } from '@/common/typings/asset';
import { AssetType } from '@inf-monkeys/monkeys';
import * as joiful from 'joiful';

export class ListTagDto {
  @joiful.string().allow(ALLOW_ASSET_TYPES)
  type: AssetType;

  @joiful.boolean()
  isPresetAsset: boolean;

  @joiful.boolean()
  isPublicAsset: boolean;
}
