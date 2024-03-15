import { vinesFetcher } from '@/apis/fetcher.ts';
import { IMd5Response } from '@/apis/resources/typting.ts';

export const getResourceByMd5 = (md5: string) =>
  vinesFetcher<IMd5Response>({
    method: 'GET',
    responseResolver: (res) => (res.json() as unknown as { data: IMd5Response })?.data,
  })('/api/resources/md5/' + md5);
