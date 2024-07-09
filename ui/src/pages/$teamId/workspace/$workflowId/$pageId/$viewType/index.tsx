import React from 'react';

import { createFileRoute, useParams } from '@tanstack/react-router';

import { VinesView } from '@/components/ui/vines-iframe/view';
import { VinesFlowProvider } from '@/components/ui/vines-iframe/view/vines-flow-provider.tsx';
import { createViewStore, ViewStoreProvider } from '@/store/useViewStore';

const ViewFlowPage: React.FC = () => {
  const { workflowId, pageId, viewType } = useParams({ from: '/$teamId/workspace/$workflowId/$pageId/$viewType' });

  return (
    <VinesFlowProvider workflowId={workflowId}>
      <ViewStoreProvider createStore={createViewStore}>
        <VinesView id={pageId} workflowId={workflowId} pageId={pageId} type={viewType} />
      </ViewStoreProvider>
    </VinesFlowProvider>
  );
};

export const Route = createFileRoute('/$teamId/workspace/$workflowId/$pageId/$viewType/')({
  component: ViewFlowPage,
});
