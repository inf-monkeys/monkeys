import React from 'react';

import { VinesLoading } from '@/components/ui/loading';
import { cn } from '@/utils/index.ts';

function Skeleton({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={cn('animate-pulse rounded-md bg-muted', className)} {...props} />;
}

function SkeletonWithFullscreenUseLoading({ className, children, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div className={cn('vines-center relative size-full', className)} {...props}>
      {children}
      <VinesLoading className="absolute" />
    </div>
  );
}

export { Skeleton, SkeletonWithFullscreenUseLoading };
