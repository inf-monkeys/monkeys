import React, { lazy, Suspense } from 'react';

import { Skeleton } from '@/components/ui/skeleton.tsx';

export interface IVinesImageMaskPreviewProps {
  src: string;
  onFinished?: (src: string) => void;

  className?: string;
}

const VinesMaskEditorPreviewCore = lazy(() => import('./preview-lazy.tsx'));

export const VinesImageMaskPreview: React.FC<IVinesImageMaskPreviewProps> = (props) => (
  <Suspense fallback={<Skeleton className="h-[15.8rem] w-full" />}>
    <VinesMaskEditorPreviewCore {...props} />
  </Suspense>
);
