import React, { lazy, Suspense } from 'react';

import { SkeletonWithFullscreenUseLoading } from '@/components/ui/skeleton.tsx';

const DesignBoardViewLazy = lazy(() => import('./vines-design-board-lazy.tsx'));

export const DesignBoardView: React.FC = () => (
  <Suspense fallback={<SkeletonWithFullscreenUseLoading />}>
    <DesignBoardViewLazy />
  </Suspense>
);
