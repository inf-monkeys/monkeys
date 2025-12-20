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

  const [{ mode, hideSpaceHeader: urlHideSpaceHeader }] = useUrlState<{
    mode: 'normal' | 'fast' | 'mini';
    hideSpaceHeader: boolean;
  }>();

  const isMiniFrame = mode === 'mini';

  const hideSpaceHeader = urlHideSpaceHeader || oem?.theme.hideSpaceHeader || false;

  return (
    <div
      ref={ref}
      className={cn(
        'flex w-full gap-global',
        hideSpaceHeader
          ? 'h-[calc(var(--oem-vh)-var(--global-spacing)*2)]'
          : 'h-[calc(var(--oem-vh)-(var(--global-spacing)*5.5)-2rem)]',
      )}
    >
      {!vinesIFrameVisible && sidebar}
      <div
        className={cn(
          'dark:bg-workspace-dark bg-workspace-light relative overflow-hidden rounded-lg',
          !vinesIFrameVisible && sidebar && 'ml-0',
          // 修改这里，当没有侧边栏时使用全宽
          isMiniFrame ? '' : sidebar ? 'w-[calc(var(--oem-vw)-17rem)]' : 'w-full',
          className,
        )}
      >
        {children}
      </div>
    </div>
  );
};
