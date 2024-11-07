import React, { lazy, Suspense } from 'react';

import { Skeleton } from '@/components/ui/skeleton.tsx';

export interface IVinesFlowProviderProps {
  workflowId: string;
  children: React.ReactNode;
}

const VinesFlowProviderCore = lazy(() => import('./lazy.tsx'));

export const VinesFlowProvider: React.FC<IVinesFlowProviderProps> = (props) => (
  <Suspense fallback={<Skeleton className="size-full" />}>
    <VinesFlowProviderCore {...props} />
  </Suspense>
);
