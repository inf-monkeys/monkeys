import React, { useEffect } from 'react';

import { useElementSize } from '@/hooks/use-resize-observer.ts';
import { usePageStore } from '@/store/usePageStore';
import { cn } from '@/utils';

interface IVinesSpaceProps {
  children: React.ReactNode;
  sidebar?: React.ReactNode;
}

export const VinesSpace: React.FC<IVinesSpaceProps> = ({ children, sidebar }) => {
  const { ref, width, height } = useElementSize();

  const setContainerWidth = usePageStore((s) => s.setContainerWidth);
  const setContainerHeight = usePageStore((s) => s.setContainerHeight);
  const setWorkbenchVisible = usePageStore((s) => s.setWorkbenchVisible);
  useEffect(() => {
    setContainerWidth(width);
    setContainerHeight(height);
    setWorkbenchVisible(false);
  }, [width, height]);

  const vinesIFrameVisible = usePageStore((s) => s.vinesIFrameVisible);

  return (
    <div className="flex h-[calc(100%-3.5rem)] w-full">
      {!vinesIFrameVisible && sidebar}
      <div
        ref={ref}
        className={cn(
          'relative m-4 w-[calc(100vw-15rem)] overflow-hidden rounded-md border border-input bg-slate-1 shadow-sm',
          !vinesIFrameVisible && 'ml-0',
        )}
      >
        {children}
      </div>
    </div>
  );
};
