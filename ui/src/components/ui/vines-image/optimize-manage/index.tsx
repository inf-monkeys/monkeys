import React, { useEffect, useRef } from 'react';

import useSWR from 'swr';

import { useCreation, useLatest, useMemoizedFn } from 'ahooks';
import { rotation } from 'exifr';
import { isUndefined } from 'lodash';

import GoldenRetriever from '@/components/ui/vines-image/optimize-manage/golden-retriever';
import {
  canvasToBlob,
  checkImageUrlAvailable,
  getProportionalDimensions,
  resizeImage,
  rotateImage,
  Rotation,
} from '@/components/ui/vines-image/utils.ts';
import VinesEvent from '@/utils/events.ts';

interface IConvertThumbnailsParams {
  url: string;
  targetWidth?: number | null;
  targetHeight?: number | null;
  thumbnailType?: string;
}

interface QueueItem {
  src: string;
  url: string;
  width?: number;
  height?: number;
  callback: (url: string) => void;
}

const OptimizeManage: React.FC = () => {
  const goldenRetriever = useCreation(() => new GoldenRetriever(), []);

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

  const queue = useRef<QueueItem[]>([]);
  const queueProcessing = useRef(false);

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

      return Promise.all([onload, orientationPromise]).then(([image, orientation]) => {
        const dimensions = getProportionalDimensions(image, targetWidth, targetHeight, orientation.deg);
        const rotatedImage = rotateImage(image, orientation);
        const resizedImage = resizeImage(rotatedImage, dimensions.width, dimensions.height);
        return canvasToBlob(resizedImage, thumbnailType, 80);
      });
    },
  );

  const processQueue = useMemoizedFn(async () => {
    queueProcessing.current = true;
    if (queue.current.length > 0) {
      const current = queue.current.shift();
      if (!current) {
        return Promise.resolve();
      }

      const src = current.src;
      // 生成缩略图
      let thumbBlobUrl = src;
      try {
        const thumbBlob = await convertThumbnails({
          url: current.url,
          targetWidth: current.width || 300,
          targetHeight: current.height || 300,
          thumbnailType: 'image/png',
        });
        thumbBlobUrl = URL.createObjectURL(thumbBlob);

        // GoldenRetriever
        goldenRetriever.addFile(src, thumbBlob);
      } catch (e) {
        console.error('[VinesImage] 生成缩略图失败！', e);
      }

      current.callback(thumbBlobUrl);

      await setCachePreviewImageUrl((prev) => ({ ...prev, [src]: thumbBlobUrl }));

      return processQueue();
    }
    queueProcessing.current = false;
    return Promise.resolve();
  });

  useEffect(() => {
    VinesEvent.on('vines-optimize-image', async ({ src, callback, url: _, ...rest }: QueueItem) => {
      if (isUndefined(latestCacheImageUrls.current) || isUndefined(latestThumbImageUrlMapper.current)) {
        return;
      }

      if (latestCachePreviewImageUrls.current && latestCachePreviewImageUrls.current[src]) {
        callback(latestCachePreviewImageUrls.current[src]);
        return;
      }

      // use cache if available
      const getGoldenRetrieverFileUrl = await goldenRetriever.getFile(src);
      if (getGoldenRetrieverFileUrl) {
        await setCachePreviewImageUrl((prev) => ({ ...prev, [src]: getGoldenRetrieverFileUrl }));
        callback(getGoldenRetrieverFileUrl);
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
          const imageBlob = await fetch(targetSrc).then((res) => res.blob());

          const fetchImageUrl = URL.createObjectURL(imageBlob);
          url = fetchImageUrl;

          void setCacheImageUrl((prev) => ({ ...prev, [targetSrc]: fetchImageUrl }));
        }

        // 生成预览图
        queue.current.push({ url, src, callback, ...rest });
        if (!queueProcessing.current) {
          void processQueue();
        }
      } catch {
        callback(isThumbAvailable ? thumbUrl : src);
      }
    });
  }, []);

  return null;
};

export default OptimizeManage;
