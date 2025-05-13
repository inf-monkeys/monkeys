import React, { lazy, Suspense } from 'react';

import { Skeleton } from '@/components/ui/skeleton.tsx';

export interface IVinesImageEditorProps {
  fileName?: string;
  width?: number;
  value?: string;
  onChange?: (value: string) => void;
  children?: React.ReactNode;
  aspectRatio?: number;
  tooltipI18nKey?: string;
}

const VinesImageEditorCore = lazy(() => import('./image-editor-lazy.tsx'));

export const VinesImageEditor: React.FC<IVinesImageEditorProps> = (props) => (
  <Suspense fallback={<Skeleton />}>
    <VinesImageEditorCore {...props} />
  </Suspense>
);
