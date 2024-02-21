import * as React from 'react';

import './index.scss';

import { Loader2 } from 'lucide-react';

import { cn } from '@/utils';

export type SpinnerType = undefined | 'success' | 'error';

interface SpinnerProps {
  loading?: boolean;
  type?: SpinnerType;
  className?: string;
}

/**
 * Spinner
 * @param loading 是否在加载，默认为 `true`
 * @param type 加载结果类型，默认为 `undefined`，当 `loading` 为 `false` 时，默认展示 `success`
 * @param className
 * @constructor
 */
const Spinner: React.FC<SpinnerProps> = ({ loading = true, type, className }) => {
  return (
    <div className={cn('flex min-h-[20px] min-w-[20px] items-center justify-center', className)}>
      {loading && <Loader2 className="h-4 w-4 animate-spin" />}
      {!loading && (
        <div className="absolute">
          {type === 'error' ? <div className="icon-error" /> : <div className="icon-check" />}
        </div>
      )}
    </div>
  );
};

Spinner.displayName = 'Spinner';

export { Spinner };
