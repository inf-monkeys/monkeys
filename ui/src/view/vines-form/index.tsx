import React, { lazy, Suspense } from 'react';

import { SkeletonWithFullscreenUseLoading } from '@/components/ui/skeleton.tsx';

const VinesFormLazy = lazy(() => import('./vines-form-lazy.tsx'));

export const VinesForm: React.FC = () => (
  <Suspense fallback={<SkeletonWithFullscreenUseLoading />}>
    <VinesFormLazy />
  </Suspense>
);
