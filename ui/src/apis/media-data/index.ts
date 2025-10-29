import useSWRMutation from 'swr/mutation';

import { MediaAsset } from '@/apis/evaluation/typings';
import { vinesFetcher } from '@/apis/fetcher.ts';

export const useDeleteMediaData = (id: string) =>
  useSWRMutation(`/api/media-files/${id}`, vinesFetcher({ method: 'DELETE' }));

export const getMediaAsset = (assetId: string): Promise<MediaAsset> => {
  return vinesFetcher<MediaAsset>({
    method: 'GET',
    simple: true,
  })(`/api/media-files/${assetId}`).then((result) => result as MediaAsset);
};

export const togglePinMedia = (id: string, pinned: boolean) =>
  vinesFetcher<{ success: boolean }>({
    method: 'PUT',
    simple: true,
  })(`/api/media-files/${id}/pin`, { pinned });

export const generateMediaDescription = (id: string, type?: string, autoUpdate?: boolean) =>
  vinesFetcher<{ description: string; updated: boolean }>({
    method: 'POST',
    simple: true,
  })(`/api/media-files/${id}/generate-description`, { type, autoUpdate });
