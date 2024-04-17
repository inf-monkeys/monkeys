import { vinesFetcher } from '@/apis/fetcher.ts';
import { IMd5Response, IVinesResource } from '@/apis/resources/typting.ts';

export const getResourceByMd5 = (md5: string) =>
  vinesFetcher<{ data: IMd5Response }>({
    method: 'GET',
    responseResolver: (res) => res.json() as unknown as { data: IMd5Response },
  })('/api/media-files/md5/' + md5);

export const createMediaFile = (
  parma: Pick<
    IVinesResource,
    'type' | 'displayName' | 'url' | 'source' | 'tags' | 'categoryIds' | 'params' | 'size' | 'md5'
  >,
) => vinesFetcher<IVinesResource>({ method: 'POST', simple: true })('/api/media-files', parma);
