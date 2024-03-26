import { ALLOW_ASSET_TYPES, AssetType } from '@/common/typings/asset';
import * as joiful from 'joiful';

export class SearchWorkflowsByAssetDto {
  @joiful.string().required()
  assetId: string;

  @joiful.string().allow([...ALLOW_ASSET_TYPES, 'block'])
  assetType: AssetType | 'block';
}
