import { authzFetcher } from '@/apis/non-fetcher.ts';
import { IMd5Response } from '@/apis/resources/typting.ts';

export const getResourceByMd5 = (md5: string) => authzFetcher<IMd5Response>(`/api/resources/md5/${md5}`);
