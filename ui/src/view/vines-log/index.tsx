import React, { lazy, Suspense } from 'react';

import { SkeletonWithFullscreenUseLoading } from '@/components/ui/skeleton.tsx';

const VinesLogViewLazy = lazy(() => import('./vines-log-lazy.tsx'));

export const VinesLogView: React.FC = () => (
  <Suspense fallback={<SkeletonWithFullscreenUseLoading />}>
    <VinesLogViewLazy />
  </Suspense>
);
