import React, { memo, useEffect, useState } from 'react';

import useSWR from 'swr';

import { motion } from 'framer-motion';
import { Eye } from 'lucide-react';
import Image from 'rc-image';

import { VinesLoading } from '@/components/ui/loading';
import { useLocalStorage } from '@/hooks/use-local-storage';
import VinesEvent from '@/utils/events.ts';

interface ILazyImageProps {
  src: string;
  alt?: string;

  disabledPreview?: boolean;

  width?: number;
  height?: number;
}

export const LazyImage: React.FC<ILazyImageProps> = memo(({ src, alt, width, height, disabledPreview = false }) => {
  const [image, setImage] = useState<string>('');

  const [themeMode] = useLocalStorage<string>('vines-ui-dark-mode', 'auto', false);
  const isDark = themeMode === 'dark';

  const { data: cacheImageUrls } = useSWR<Record<string, string>>('vines-image-urls', null, {
    fallbackData: {},
  });

  useEffect(() => {
    VinesEvent.emit('vines-optimize-image', {
      src,
      width,
      height,
      callback: setImage,
    });
  }, []);

  return image ? (
    <Image
      src={image}
      alt={alt}
      fallback={isDark ? '/fallback_image_dark.webp' : '/fallback_image.webp'}
      preview={
        disabledPreview
          ? false
          : {
              src: cacheImageUrls?.[src] || src,
              mask: <Eye className="stroke-white" />,
            }
      }
    />
  ) : (
    <>
      <motion.div
        key="vines-image-loading-skeleton"
        className="size-full animate-pulse rounded-md bg-muted"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
      />
      <VinesLoading key="vines-image-loading" className="absolute" />
    </>
  );
});

LazyImage.displayName = 'VinesLazyImage';
