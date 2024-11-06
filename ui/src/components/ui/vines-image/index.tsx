import React, { memo } from 'react';

import { useInViewport } from 'ahooks';
import { AnimatePresence } from 'framer-motion';

import { LazyImage } from '@/components/ui/vines-image/image.tsx';
import { useElementSize } from '@/hooks/use-resize-observer.ts';
import { cn } from '@/utils';

interface IVinesImageProps {
  src: string;
  alt?: string;

  className?: string;
}

export const VinesImage: React.FC<IVinesImageProps> = memo(({ src, alt = 'image', className }) => {
  const { ref, height, width } = useElementSize();
  const [inViewport] = useInViewport(ref);

  return (
    <div ref={ref} className={cn('relative flex items-center justify-center', className)}>
      <AnimatePresence>{inViewport && <LazyImage src={src} alt={alt} height={height} width={width} />}</AnimatePresence>
    </div>
  );
});

VinesImage.displayName = 'VinesImage';
