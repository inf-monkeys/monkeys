import React, { lazy, Suspense } from 'react';

import { Meta, Uppy, UppyFile } from '@uppy/core';
import type { EventEmitter } from 'ahooks/lib/useEventEmitter';

import { Skeleton } from '@/components/ui/skeleton.tsx';

export interface IVinesUploaderProps {
  className?: string;
  children?: React.ReactNode;

  uppy$?: EventEmitter<Uppy<Meta, Record<string, never>>>;

  files?: string[];
  onChange?: (urls: string[], files: UppyFile<Meta, Record<string, never>>[]) => void;

  maxSize?: number;

  max?: number;
  min?: number;

  accept?: string[] | null;

  autoUpload?: boolean;
  basePath?: string;
}

const VinesUploaderCore = lazy(() => import('./vines-uploader-lazy.tsx'));

export const VinesUploader: React.FC<IVinesUploaderProps> = (props) => (
  <Suspense fallback={<Skeleton className="h-[15.8rem] w-full" />}>
    <VinesUploaderCore {...props} />
  </Suspense>
);
