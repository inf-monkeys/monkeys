import { ALLOW_ASSET_TYPES } from '@/common/typings/asset';
import { AssetType } from '@inf-monkeys/monkeys';
import * as joiful from 'joiful';

export class ListAssetFilterDto {
  @joiful.string().allow(ALLOW_ASSET_TYPES)
  type: AssetType;
}
