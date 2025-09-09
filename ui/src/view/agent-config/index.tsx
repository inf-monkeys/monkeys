import React, { lazy, Suspense } from 'react';

import { SkeletonWithFullscreenUseLoading } from '@/components/ui/skeleton.tsx';

const AgentV2ConfigView = lazy(() => import('@/view/agent-v2-config/vines-agent-v2-config-lazy.tsx'));

export const AgentConfigView: React.FC = () => (
  <Suspense fallback={<SkeletonWithFullscreenUseLoading />}>
    <AgentV2ConfigView />
  </Suspense>
);
