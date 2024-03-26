import { AssetPublishConfig } from '@/database/entities/assets/base-asset';
import * as joiful from 'joiful';

export class PublishAssetDto {
  @joiful.object()
  publishConfig: AssetPublishConfig;
}
