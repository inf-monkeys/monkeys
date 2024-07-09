import React, { useEffect } from 'react';

import { Outlet, useParams } from '@tanstack/react-router';

import { useElementSize } from '@mantine/hooks';

import { IPageInstance } from '@/apis/pages/typings.ts';
import { ViewGuard } from '@/components/layout-wrapper/view-guard.tsx';
import { usePageStore } from '@/store/usePageStore';

interface IWorkspaceIframeProps extends React.ComponentPropsWithoutRef<'div'> {}

export const WorkspaceIframe: React.FC<IWorkspaceIframeProps> = () => {
  const { workflowId, pageId, viewType } = useParams({ from: '/$teamId/workspace/$workflowId/$pageId/$$viewType' });

  const { ref, width, height } = useElementSize();

  const { setContainerWidth, setContainerHeight, setWorkbenchVisible, setPage } = usePageStore();
  useEffect(() => {
    setContainerWidth(width);
    setContainerHeight(height);
    setWorkbenchVisible(false);
  }, [width, height]);

  useEffect(() => {
    setPage({
      id: pageId,
      type: viewType as IPageInstance['type'],
      isBuiltIn: true,
      displayName: '',
      workflowId,
      instance: {
        name: '',
        icon: '',
        type: viewType as IPageInstance['type'],
      },
    });
  }, [viewType]);

  return (
    <ViewGuard ref={ref}>
      <Outlet />
    </ViewGuard>
  );
};
