import React, { lazy, Suspense } from 'react';

import { SkeletonWithFullscreenUseLoading } from '@/components/ui/skeleton.tsx';

const VinesChatViewLazy = lazy(() => import('./vines-chat-lazy.tsx'));

export const VinesChatView: React.FC = () => (
  <Suspense fallback={<SkeletonWithFullscreenUseLoading />}>
    <VinesChatViewLazy />
  </Suspense>
);
