import React, { lazy, Suspense } from 'react';

import { SkeletonWithFullscreenUseLoading } from '@/components/ui/skeleton.tsx';

const VinesFlowLazy = lazy(() => import('./vines-flow-lazy.tsx'));

export const VinesFlow: React.FC = () => (
  <Suspense fallback={<SkeletonWithFullscreenUseLoading />}>
    <VinesFlowLazy />
  </Suspense>
);
