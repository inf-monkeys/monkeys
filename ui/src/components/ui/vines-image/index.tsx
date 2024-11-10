import React, { lazy, Suspense } from 'react';

import { Skeleton } from '@/components/ui/skeleton.tsx';

export interface IVinesImageProps {
  src: string;
  alt?: string;

  className?: string;
}

const VinesImageCore = lazy(() => import('./vines-image-lazy.tsx'));

export const VinesImage: React.FC<IVinesImageProps> = (props) => (
  <Suspense fallback={<Skeleton className="size-full min-h-52 min-w-52" />}>
    <VinesImageCore {...props} />
  </Suspense>
);

// IMAGE OPTIMIZATION MANAGE
const VinesImageOptimizeManageCore = lazy(() => import('./optimize-manage/index.tsx'));
export const VinesImageOptimizeManage = () => (
  <Suspense fallback={null}>
    <VinesImageOptimizeManageCore />
  </Suspense>
);
