import React, { FC, lazy, Suspense } from 'react';

import { Options } from 'react-markdown';

import { Skeleton } from '@/components/ui/skeleton.tsx';

export interface IVinesMarkdownProps extends Options {
  className?: string;

  allowHtml?: boolean;
}

const VinesMarkdownCore = lazy(() => import('./core.tsx'));

export const VinesMarkdown: React.FC<IVinesMarkdownProps> = (props) => (
  <Suspense fallback={<Skeleton className="min-h-12 min-w-32" />}>
    <VinesMarkdownCore {...props} />
  </Suspense>
);

const MemoizedReactMarkdownCore = lazy(() => import('./memoized-core.tsx'));

export const MemoizedReactMarkdown: FC<Options> = (props) => {
  return (
    <Suspense fallback={<Skeleton className="min-h-6 min-w-32" />}>
      <MemoizedReactMarkdownCore {...props} />
    </Suspense>
  );
};
