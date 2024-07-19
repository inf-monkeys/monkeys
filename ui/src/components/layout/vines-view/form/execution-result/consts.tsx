import React from 'react';
import { forwardRef } from 'react';

import { GridItemProps, GridListProps } from 'react-virtuoso';

import { cn } from '@/utils';

export const gridComponents = {
  List: forwardRef(({ children, className, ...props }: GridListProps, ref: React.ForwardedRef<HTMLDivElement>) => (
    <div ref={ref} className={cn('flex flex-wrap', className)} {...props}>
      {children}
    </div>
  )),
  Item: ({ children, className, ...props }: GridItemProps) => (
    <div className={cn('box-border w-1/3 flex-none content-stretch p-3', className)} {...props}>
      {children}
    </div>
  ),
};

gridComponents.List.displayName = 'VList';
