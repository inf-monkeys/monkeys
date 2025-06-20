import React, { lazy, Suspense } from 'react';

import { SkeletonWithFullscreenUseLoading } from '@/components/ui/skeleton.tsx';

const GlobalDesignBoardViewLazy = lazy(() => import('./vines-global-design-board-lazy.tsx'));

export const GlobalDesignBoardView: React.FC = () => (
  <Suspense fallback={<SkeletonWithFullscreenUseLoading />}>
    <GlobalDesignBoardViewLazy />
  </Suspense>
);
