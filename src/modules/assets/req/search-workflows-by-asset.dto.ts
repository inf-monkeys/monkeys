import { ALLOW_ASSET_TYPES } from '@/common/typings/asset';
import { AssetType } from '@inf-monkeys/monkeys';
import * as joiful from 'joiful';

export class SearchWorkflowsByAssetDto {
  @joiful.string().required()
  assetId: string;

  @joiful.string().allow([...ALLOW_ASSET_TYPES, 'block'])
  assetType: AssetType;
}
