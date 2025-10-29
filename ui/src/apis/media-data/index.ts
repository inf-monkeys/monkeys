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

export const imageGenerateTxt = (id: string) =>
  vinesFetcher<MediaAsset>({
    method: 'POST',
    simple: true,
  })(`/api/media-files/${id}/image-generate-txt`);

export const imageGenerate3DModel = (id: string) =>
  vinesFetcher<MediaAsset>({
    method: 'POST',
    simple: true,
  })(`/api/media-files/${id}/image-generate-3d-model`);

export const imageGenerateMarkdown = (id: string) =>
  vinesFetcher<MediaAsset>({
    method: 'POST',
    simple: true,
  })(`/api/media-files/${id}/image-generate-markdown`);

export const txtGenerateImage = (id: string, text: string, jsonFileName?: string) =>
  vinesFetcher<MediaAsset>({
    method: 'POST',
    simple: true,
  })(`/api/media-files/${id}/txt-generate-image`, { text, jsonFileName });

export const txtGenerateMarkdown = (id: string, text: string, jsonFileName?: string) =>
  vinesFetcher<MediaAsset>({
    method: 'POST',
    simple: true,
  })(`/api/media-files/${id}/txt-generate-markdown`, {
    text,
    jsonFileName,
  });

export const txtGenerate3DModel = (id: string, text: string, jsonFileName?: string) =>
  vinesFetcher<MediaAsset>({
    method: 'POST',
    simple: true,
  })(`/api/media-files/${id}/txt-generate-3d-model`, {
    text,
    jsonFileName,
  });
