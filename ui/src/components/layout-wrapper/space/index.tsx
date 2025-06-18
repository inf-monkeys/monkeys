import React, { useEffect } from 'react';

import { useSystemConfig } from '@/apis/common';
import { useElementSize } from '@/hooks/use-resize-observer.ts';
import useUrlState from '@/hooks/use-url-state';
import { usePageStore } from '@/store/usePageStore';
import { cn } from '@/utils';

interface IVinesSpaceProps {
  children: React.ReactNode;
  className?: string;
  sidebar?: React.ReactNode;
}

export const VinesSpace: React.FC<IVinesSpaceProps> = ({ children, sidebar, className }) => {
  const { ref, width, height } = useElementSize();

  const { data: oem } = useSystemConfig();

  const setContainerWidth = usePageStore((s) => s.setContainerWidth);
  const setContainerHeight = usePageStore((s) => s.setContainerHeight);
  const setWorkbenchVisible = usePageStore((s) => s.setWorkbenchVisible);

  useEffect(() => {
    setContainerWidth(width);
    setContainerHeight(height);
    setWorkbenchVisible(false);
  }, [width, height]);

  const vinesIFrameVisible = usePageStore((s) => s.vinesIFrameVisible);

  const [{ hideSpaceHeader: urlHideSpaceHeader }] = useUrlState<{ hideSpaceHeader: boolean }>({
    hideSpaceHeader: false,
  });

  const hideSpaceHeader = oem?.theme.hideSpaceHeader ?? urlHideSpaceHeader;

  return (
    <div ref={ref} className={cn('flex w-full', hideSpaceHeader ? 'h-[calc(100vh-3rem)]' : 'h-[calc(100vh-5.75rem)]')}>
      {!vinesIFrameVisible && sidebar}
      <div
        className={cn(
          'dark:bg-workspace-dark bg-workspace-light relative mt-4 overflow-hidden rounded-xl shadow-sm',
          !vinesIFrameVisible && sidebar && 'ml-0',
          // 修改这里，当没有侧边栏时使用全宽
          sidebar ? 'w-[calc(100vw-17rem)]' : 'w-full',
          className,
        )}
      >
        {children}
      </div>
    </div>
  );
};
