import React from 'react';

import { cn } from '@/utils';

export const TempComponentDemoWrapper: React.FC<{ title: string; children: React.ReactNode; horizontal?: boolean }> = ({
  title,
  children,
  horizontal = false,
}) => {
  return (
    <div className="flex flex-col">
      <span className="mb-3">{title}</span>
      <div className={cn('flex gap-2', !horizontal && 'flex-col')}>{children}</div>
    </div>
  );
};
