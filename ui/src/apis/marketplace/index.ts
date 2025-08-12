import { IExportAssets, IExportedAsset } from '@/schema/workspace/export-asset';

import { vinesFetcher } from '../fetcher';

export const exportAssetsByAssetList = (assetsData: IExportAssets) =>
  vinesFetcher<IExportedAsset[]>({ method: 'POST', simple: true })(
    '/api/marketplace/team/exportAssetsByAssetList',
    assetsData,
  );
