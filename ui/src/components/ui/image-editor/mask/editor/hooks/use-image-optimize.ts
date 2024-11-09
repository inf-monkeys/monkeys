import React, { useEffect, useRef, useState } from 'react';

import { useMemoizedFn } from 'ahooks';
import imageCompression, { Options } from 'browser-image-compression';
import { fileTypeFromBlob, MimeType } from 'file-type';

import { getFileNameByOssUrl } from '@/components/ui/vines-uploader/utils.ts';

interface IImageOptimizeProps extends Omit<Options, 'useWebWorker'> {
  src: string | File;

  retry?: number;
  onFetchImageFailed?: (end: boolean) => void;
  onOptimizeFailed?: (end: boolean) => void;

  onFinished?: (file: File) => void;
}

export const useImageOptimize = ({
  src,
  onFetchImageFailed,
  onOptimizeFailed,
  retry = 5,
  onProgress,
  onFinished,
  ...OptimizeOptions
}: IImageOptimizeProps) => {
  const [optimizeImage, setOptimizeImage] = useState<string | null>(null);
  const [optimizeFile, setOptimizeFile] = useState<File | null>(null);

  const [file, setFile] = useState<File | null>(null);

  const fetchImageMap = useRef(new Map<string, File>());
  const fetchImageCount = useRef(0);
  const fetchImage = useMemoizedFn(async (url: string): Promise<File | null> => {
    if (fetchImageMap.current.has(url)) {
      return fetchImageMap.current.get(url)!;
    }

    try {
      const fetchResponse = await fetch(url, { method: 'GET', headers: { Accept: 'image/*' } });
      const newBlob = await fetchResponse.blob();

      let fileType = (await fileTypeFromBlob(newBlob))?.mime;
      if (!fileType) {
        fileType = `image/${url.match(/\.([a-zA-Z0-9]+)$/)?.[1] ?? 'png'}` as MimeType;
      }

      const fileName = getFileNameByOssUrl(url, 'optimized-image.png');

      const newFile = new File([newBlob], fileName, { type: fileType });

      if (!newFile.type.includes('image/')) {
        throw new Error('Unsupported image type');
      }

      fetchImageMap.current.set(url, newFile);
      return newFile;
    } catch (error) {
      if (fetchImageCount.current < retry) {
        onFetchImageFailed?.(false);
        fetchImageCount.current += 1;
        return new Promise((resolve) => {
          setTimeout(() => resolve(fetchImage(url)), 2 ** fetchImageCount.current * 1000);
        });
      } else {
        onFetchImageFailed?.(true);
      }
    }
    return null;
  });

  const optimizeImageCount = useRef(0);
  const handleOptimizeImage = useMemoizedFn(
    async (file: File, updateProgress?: (val: number) => void): Promise<File | null> => {
      try {
        if (updateProgress) {
          updateProgress(0);
        } else {
          onProgress?.(0);
        }
        const output = await imageCompression(file, {
          useWebWorker: true,
          maxSizeMB: 1,
          maxWidthOrHeight: 1920,
          onProgress: (val) => {
            if (updateProgress) {
              updateProgress(val);
            } else {
              onProgress?.(val);
            }
          },
          ...OptimizeOptions,
        });

        onFinished?.(output);
        return output;
      } catch {
        if (optimizeImageCount.current < retry) {
          optimizeImageCount.current += 1;
          return new Promise((resolve) => {
            setTimeout(() => resolve(handleOptimizeImage(file)), 2 ** optimizeImageCount.current * 1000);
          });
        } else {
          onOptimizeFailed?.(true);
          return null;
        }
      }
    },
  );

  const handleUpdateState = useMemoizedFn((newFile?: File | null) => {
    if (newFile) {
      setOptimizeImage(URL.createObjectURL(newFile));
      setOptimizeFile(newFile);
    }
  });

  useEffect(() => {
    if (!src) return;
    setOptimizeFile(null);
    setOptimizeImage(null);
    setFile(null);
    if (src instanceof File) {
      handleOptimizeImage(src).then(handleUpdateState);
    } else {
      fetchImage(src).then((newFile) => {
        setFile(newFile);
        if (newFile) {
          handleOptimizeImage(newFile).then(handleUpdateState);
        }
      });
    }
  }, [src]);

  const onFileInputChange = useMemoizedFn((event: React.ChangeEvent<HTMLInputElement>) => {
    const inputFile = event.target.files?.[0];
    if (!inputFile) return;

    setOptimizeFile(null);
    setOptimizeImage(null);
    setFile(inputFile);
    handleOptimizeImage(inputFile).then(handleUpdateState);
  });

  return {
    file,

    optimizeImage,
    optimizeFile,

    handleOptimizeImage,

    onFileInputChange,
  };
};
