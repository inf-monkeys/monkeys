import React, { lazy, Suspense } from 'react';

import { Skeleton } from '@/components/ui/skeleton.tsx';

export interface IVinesEmojiSelectorProps extends Omit<React.ComponentPropsWithoutRef<'div'>, 'onChange'> {
  emojiLink?: string;
  onChange?: (emojiLink: string) => void;
  onFinished?: (emojiLink: string) => void;
  onlyEmoji?: boolean;
}

const VinesEmojiSelectorCore = lazy(() => import('./core.tsx'));

export const VinesEmojiSelector: React.FC<IVinesEmojiSelectorProps> = (props) => (
  <Suspense fallback={<Skeleton className="min-h-96 min-w-64" />}>
    <VinesEmojiSelectorCore {...props} />
  </Suspense>
);
