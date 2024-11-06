import React, { memo, useState } from 'react';

import { motion } from 'framer-motion';
import { Eye } from 'lucide-react';
import Image from 'rc-image';

import { VinesLoading } from '@/components/ui/loading';
import { useVinesOptimization } from '@/components/ui/vines-image/use-vines-optimization.ts';
import { useLocalStorage } from '@/hooks/use-local-storage';

interface ILazyImageProps {
  src: string;
  alt?: string;

  width?: number;
  height?: number;
}

export const LazyImage: React.FC<ILazyImageProps> = memo(({ src, alt, width, height }) => {
  const [image, setImage] = useState<string>('');

  const [themeMode] = useLocalStorage<string>('vines-ui-dark-mode', 'auto', false);
  const isDark = themeMode === 'dark';

  const { originalUrl } = useVinesOptimization({
    src,
    width,
    height,
    onCompleted: (url) => {
      setImage(url);
    },
  });

  return image ? (
    <Image
      src={image}
      alt={alt}
      fallback={isDark ? '/fallback_image_dark.webp' : '/fallback_image.webp'}
      preview={{
        src: originalUrl,
        mask: <Eye className="stroke-white" />,
      }}
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
