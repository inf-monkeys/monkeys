import useSWRMutation from 'swr/mutation';

import { MediaAsset } from '@/apis/evaluation/typings';
import { vinesFetcher } from '@/apis/fetcher.ts';

export const useDeleteMediaData = (id: string) =>
  useSWRMutation(`/api/media-files/${id}`, vinesFetcher({ method: 'DELETE' }));

export const uploadMediaFile = (form: FormData) =>
  vinesFetcher<any>({
    method: 'POST',
    simple: true,
  })(`/api/medias/s3/file`, {
    form,
  });

export const getMediaAsset = (assetId: string): Promise<MediaAsset> => {
  return vinesFetcher<MediaAsset>({
    method: 'GET',
    simple: true,
  })(`/api/media-files/${assetId}`).then((result) => result as MediaAsset);
};

export const updateMediaIcon = (id: string, iconUrl: string) =>
  vinesFetcher<MediaAsset>({
    method: 'PUT',
    simple: true,
  })(`/api/media-files/${id}`, { iconUrl, params: { thumbnailUrl: iconUrl } });

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

export const imageGenerateJson = (id: string, jsonFileName?: string) =>
  vinesFetcher<MediaAsset>({
    method: 'POST',
    simple: true,
  })(`/api/media-files/${id}/image-generate-json`, { jsonFileName });

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

export const txtGenerateJson = (id: string, text: string, jsonFileName?: string) =>
  vinesFetcher<MediaAsset>({
    method: 'POST',
    simple: true,
  })(`/api/media-files/${id}/txt-generate-json`, {
    text,
    jsonFileName,
  });

export const threeDImageUploadImage = (id: string, imageUrl: string) =>
  vinesFetcher<MediaAsset>({
    method: 'POST',
    simple: true,
  })(`/api/media-files/${id}/3d-model-upload-image`, { imageUrl });

export const threeDImageGenerateTxt = (id: string, imageUrl: string) =>
  vinesFetcher<MediaAsset>({
    method: 'POST',
    simple: true,
  })(`/api/media-files/${id}/3d-model-generate-txt`, { imageUrl });

export const threeDImageGenerateMarkdown = (id: string, imageUrl: string) =>
  vinesFetcher<MediaAsset>({
    method: 'POST',
    simple: true,
  })(`/api/media-files/${id}/3d-model-generate-markdown`, { imageUrl });

export const threeDImageGenerateJson = (id: string, imageUrl: string, jsonFileName?: string) =>
  vinesFetcher<MediaAsset>({
    method: 'POST',
    simple: true,
  })(`/api/media-files/${id}/3d-model-generate-json`, { imageUrl, jsonFileName });
