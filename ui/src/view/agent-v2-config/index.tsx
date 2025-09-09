import React, { lazy, Suspense } from 'react';

import { SkeletonWithFullscreenUseLoading } from '@/components/ui/skeleton.tsx';

const AgentV2ConfigViewLazy = lazy(() => import('./vines-agent-v2-config-lazy.tsx'));

export const AgentV2ConfigView: React.FC = () => (
  <Suspense fallback={<SkeletonWithFullscreenUseLoading />}>
    <AgentV2ConfigViewLazy />
  </Suspense>
);
