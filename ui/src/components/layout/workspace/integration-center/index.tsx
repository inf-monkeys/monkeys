import React, { lazy, Suspense } from 'react';

import { Skeleton } from '@/components/ui/skeleton.tsx';

export interface IIntegrationCenterProps extends React.ComponentPropsWithoutRef<'div'> {}

const IntegrationCenterCore = lazy(() => import('./core.tsx'));

export const IntegrationCenter: React.FC<IIntegrationCenterProps> = (props) => (
  <Suspense fallback={<Skeleton className="size-full" />}>
    <IntegrationCenterCore {...props} />
  </Suspense>
);
