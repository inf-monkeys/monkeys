import React, { lazy, Suspense } from 'react';

import { SkeletonWithFullscreenUseLoading } from '@/components/ui/skeleton.tsx';

const AgentChatViewLazy = lazy(() => import('./vines-agent-chat-lazy.tsx'));

export const AgentChatView: React.FC = () => (
  <Suspense fallback={<SkeletonWithFullscreenUseLoading />}>
    <AgentChatViewLazy />
  </Suspense>
);
