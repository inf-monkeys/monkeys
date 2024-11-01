import FileSaver from 'file-saver';

import { vinesFetcher } from '@/apis/fetcher.ts';

export const exportTeamDataAsBuiltInMarket = (info = { teamName: 'unknown', teamId: 'unknown' }) =>
  vinesFetcher({
    method: 'POST',
    simple: true,
    responseResolver: async (r) => {
      FileSaver.saveAs(await r.blob(), `${info.teamName}-${info.teamId}-${Date.now()}.json`);
    },
  })(`/api/tenant-assets/${info.teamId}/export-as-built-in-market`);
