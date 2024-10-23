import React, { lazy, Suspense } from 'react';

import { SkeletonWithFullscreenUseLoading } from '@/components/ui/skeleton.tsx';

const AgentLogsViewLazy = lazy(() => import('./vines-agent-logs-lazy.tsx'));

export const AgentLogsView: React.FC = () => (
  <Suspense fallback={<SkeletonWithFullscreenUseLoading />}>
    <AgentLogsViewLazy />
  </Suspense>
);
