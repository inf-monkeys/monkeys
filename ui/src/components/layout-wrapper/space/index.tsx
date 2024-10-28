import React, { useEffect } from 'react';

import { useElementSize } from '@/hooks/use-resize-observer.ts';
import { usePageStore } from '@/store/usePageStore';
import { cn } from '@/utils';

interface IVinesSpaceProps {
  children: React.ReactNode;
  className?: string;
  sidebar?: React.ReactNode;
}

export const VinesSpace: React.FC<IVinesSpaceProps> = ({ children, sidebar, className }) => {
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
    <div ref={ref} className="flex h-[calc(100vh-5.75rem)] w-full">
      {!vinesIFrameVisible && sidebar}
      <div
        className={cn(
          'relative mt-4 overflow-hidden rounded-xl bg-slate-1 shadow-sm',
          !vinesIFrameVisible && sidebar && 'ml-0',
          sidebar ? 'w-[calc(100vw-17rem)]' : 'w-full p-4',
          className,
        )}
      >
        {children}
      </div>
    </div>
  );
};
