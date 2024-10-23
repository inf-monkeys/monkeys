import React, { lazy, Suspense } from 'react';

import { SkeletonWithFullscreenUseLoading } from '@/components/ui/skeleton.tsx';

const AgentConfigViewLazy = lazy(() => import('./vines-agent-config-lazy.tsx'));

export const AgentConfigView: React.FC = () => (
  <Suspense fallback={<SkeletonWithFullscreenUseLoading />}>
    <AgentConfigViewLazy />
  </Suspense>
);
