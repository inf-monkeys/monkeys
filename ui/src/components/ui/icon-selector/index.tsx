import React, { lazy, Suspense } from 'react';

import { IVinesEmojiSelectorProps } from '@/components/ui/emoji-selector';
import { Skeleton } from '@/components/ui/skeleton.tsx';

export interface IVinesIconSelectorProps extends Omit<React.ComponentPropsWithoutRef<'div'>, 'onChange'> {
  onIconSelect?: (iconName: string) => void | Promise<void>;
}

const VinesIconSelectorCore = lazy(() => import('./icon-selector-lazy.tsx'));

export const VinesIconSelector: React.FC<IVinesEmojiSelectorProps> = (props) => (
  <Suspense fallback={<Skeleton className="h-96 w-[468px]" />}>
    <VinesIconSelectorCore {...props} />
  </Suspense>
);
