import React, { useEffect } from 'react';

import { Outlet, useParams } from '@tanstack/react-router';

import { IPageInstance } from '@/apis/pages/typings.ts';
import { ViewGuard } from '@/components/layout-wrapper/view-guard.tsx';
import { VINES_VIEW_ID_MAPPER } from '@/components/ui/vines-iframe/consts.ts';
import { useElementSize } from '@/hooks/use-resize-observer.ts';
import { usePageStore } from '@/store/usePageStore';

interface IWorkspaceIframeProps extends React.ComponentPropsWithoutRef<'div'> {}

export const WorkspaceIframe: React.FC<IWorkspaceIframeProps> = () => {
  const { workflowId, pageId } = useParams({ from: '/$teamId/workspace/$workflowId/$pageId/' });

  const { ref, width, height } = useElementSize();

  const { setContainerWidth, setContainerHeight, setWorkbenchVisible, setPage, setVinesIFrameVisible } = usePageStore();
  useEffect(() => {
    setContainerWidth(width);
    setContainerHeight(height);
    setWorkbenchVisible(false);
    setVinesIFrameVisible(true);
  }, [width, height]);

  useEffect(() => {
    const type = (VINES_VIEW_ID_MAPPER[pageId] || pageId) as IPageInstance['type'];
    setPage({
      id: pageId,
      type,
      isBuiltIn: true,
      displayName: '',
      workflowId,
      instance: {
        name: '',
        icon: '',
        type,
      },
    });
  }, [pageId]);

  return (
    <ViewGuard ref={ref}>
      <Outlet />
    </ViewGuard>
  );
};
