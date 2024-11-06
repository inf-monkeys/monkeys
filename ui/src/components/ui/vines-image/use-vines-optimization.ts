import useSWR from 'swr';

import { useAsyncEffect, useLatest, useMemoizedFn } from 'ahooks';
import { rotation } from 'exifr';
import { isUndefined } from 'lodash';

import {
  canvasToBlob,
  checkImageUrlAvailable,
  getProportionalDimensions,
  resizeImage,
  rotateImage,
  Rotation,
} from '@/components/ui/vines-image/utils.ts';

interface IConvertThumbnailsParams {
  url: string;
  targetWidth?: number | null;
  targetHeight?: number | null;
  thumbnailType?: string;
}

interface IVinesOptimizationParams {
  src: string;
  width?: number;
  height?: number;

  onCompleted?: (url: string) => void;
}

export const useVinesOptimization = ({ src, width, height, onCompleted }: IVinesOptimizationParams) => {
  const convertThumbnails = useMemoizedFn(
    async ({
      url,
      targetWidth = null,
      targetHeight = null,
      thumbnailType = 'image/jpeg',
    }: IConvertThumbnailsParams) => {
      const onload = new Promise<HTMLImageElement>((resolve, reject) => {
        const image = new Image();
        image.src = url;
        image.addEventListener('load', () => {
          resolve(image);
        });
        image.addEventListener('error', (event) => {
          reject(event.error || new Error('Could not create thumbnail'));
        });
      });

      const orientationPromise = rotation(url).catch(() => 1) as Promise<Rotation>;

      return Promise.all([onload, orientationPromise])
        .then(([image, orientation]) => {
          const dimensions = getProportionalDimensions(image, targetWidth, targetHeight, orientation.deg);
          const rotatedImage = rotateImage(image, orientation);
          const resizedImage = resizeImage(rotatedImage, dimensions.width, dimensions.height);
          return canvasToBlob(resizedImage, thumbnailType, 80);
        })
        .then((blob) => URL.createObjectURL(blob));
    },
  );

  const { data: thumbImageUrlMapper, mutate: setThumbImageUrlToMapper } = useSWR<Record<string, string>>(
    'vines-thumb-image-url-mapper',
    null,
    {
      fallbackData: {},
    },
  );
  const latestThumbImageUrlMapper = useLatest(thumbImageUrlMapper);

  const { data: cacheImageUrls, mutate: setCacheImageUrl } = useSWR<Record<string, string>>('vines-image-urls', null, {
    fallbackData: {},
  });
  const latestCacheImageUrls = useLatest(cacheImageUrls);

  const { data: cachePreviewImageUrls, mutate: setCachePreviewImageUrl } = useSWR<Record<string, string>>(
    'vines-preview-image-urls',
    null,
    { fallbackData: {} },
  );
  const latestCachePreviewImageUrls = useLatest(cachePreviewImageUrls);

  useAsyncEffect(async () => {
    if (isUndefined(latestCacheImageUrls.current) || isUndefined(latestThumbImageUrlMapper.current) || !onCompleted)
      return;

    if (latestCachePreviewImageUrls.current && latestCachePreviewImageUrls.current[src]) {
      onCompleted(latestCachePreviewImageUrls.current[src]);
      return;
    }

    // 构造缩略图地址
    const srcPath = src.split('/');
    const srcPathLength = srcPath.length;
    const thumbUrl = srcPath.map((it, i) => (i === srcPathLength - 2 ? `${it}_thumb` : it)).join('/');

    // 检查 OSS 缩略图可用性
    const isThumbAvailable = await checkImageUrlAvailable(thumbUrl);

    try {
      let url = latestThumbImageUrlMapper.current[src] || latestCacheImageUrls.current[src];
      if (!url) {
        let targetSrc = src;

        // 如果缩略图可用，则使用缩略图
        if (isThumbAvailable) {
          targetSrc = thumbUrl;
          void setThumbImageUrlToMapper((prev) => ({ ...prev, [thumbUrl]: src }));
        }

        // 获取图片文件
        const fetchImageUrl = URL.createObjectURL(await (await fetch(targetSrc)).blob());
        url = fetchImageUrl;

        void setCacheImageUrl((prev) => ({ ...prev, [targetSrc]: fetchImageUrl }));
      }

      // 生成预览图
      const thumbBlobUrl = await convertThumbnails({
        url,
        targetWidth: width || 200,
        targetHeight: height || 200,
        thumbnailType: 'image/png',
      });
      onCompleted(thumbBlobUrl);

      await setCachePreviewImageUrl((prev) => ({ ...prev, [src]: thumbBlobUrl }));
    } catch {
      onCompleted(isThumbAvailable ? thumbUrl : src);
    }
  }, [src]);

  return { convertThumbnails, originalUrl: latestCacheImageUrls.current?.[src] || src };
};
