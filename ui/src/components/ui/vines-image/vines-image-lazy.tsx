import React, { memo } from 'react';

import { useInViewport } from 'ahooks';
import { AnimatePresence } from 'framer-motion';

import { LazyImage } from '@/components/ui/vines-image/image.tsx';
import { IVinesImageProps } from '@/components/ui/vines-image/index.tsx';
import { useElementSize } from '@/hooks/use-resize-observer.ts';
import { cn } from '@/utils';

const VinesImage: React.FC<IVinesImageProps> = memo(({ src, alt = 'image', className, disabledPreview }) => {
  const { ref, height, width } = useElementSize();
  const [inViewport] = useInViewport(ref);

  return (
    <div ref={ref} className={cn('relative flex items-center justify-center', className)}>
      <AnimatePresence>
        {inViewport && (
          <LazyImage src={src} alt={alt} height={height} width={width} disabledPreview={disabledPreview} />
        )}
      </AnimatePresence>
    </div>
  );
});

VinesImage.displayName = 'VinesImage';

export default VinesImage;
