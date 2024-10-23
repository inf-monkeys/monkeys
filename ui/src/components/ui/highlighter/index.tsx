import React, { lazy, Suspense } from 'react';

import { languageMap } from '@/components/ui/highlighter/useHighlight.ts';
import { Skeleton } from '@/components/ui/skeleton.tsx';

export interface IVinesHighlighterProps extends React.ComponentPropsWithoutRef<'pre'> {
  children: string;
  language: (typeof languageMap)[number];
}

const VinesHighlighterCore = lazy(() => import('./core.tsx'));

export const VinesHighlighter: React.FC<IVinesHighlighterProps> = (props) => (
  <Suspense fallback={<Skeleton className="min-h-12 min-w-32" />}>
    <VinesHighlighterCore {...props} />
  </Suspense>
);
