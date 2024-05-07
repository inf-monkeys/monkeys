import useSWRMutation from 'swr/mutation';

import { vinesFetcher } from '@/apis/fetcher.ts';

export const useDeleteMediaData = (id: string) =>
  useSWRMutation(`/api/media-files/${id}`, vinesFetcher({ method: 'DELETE' }));
