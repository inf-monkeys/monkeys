import React, { useEffect } from 'react';

import { WorkspaceSidebar } from '@/components/layout-wrapper/workspace/space/sidebar';
import { useElementSize } from '@/hooks/use-resize-observer.ts';
import { usePageStore } from '@/store/usePageStore';
import { cn } from '@/utils';

interface ISpaceProps extends React.ComponentPropsWithoutRef<'div'> {}

export const Space: React.FC<ISpaceProps> = ({ children }) => {
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
      {!vinesIFrameVisible && <WorkspaceSidebar />}
      <div
        ref={ref}
        className={cn(
          'relative m-4 w-full overflow-hidden rounded-md border border-input bg-slate-1 shadow-sm',
          !vinesIFrameVisible && 'ml-0',
        )}
      >
        {children}
      </div>
    </div>
  );
};
