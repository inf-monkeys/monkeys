import React from 'react';

import { createLazyFileRoute, useParams } from '@tanstack/react-router';

import { VinesView } from '@/components/ui/vines-iframe/view';
import { createViewStore, ViewStoreProvider } from '@/store/useViewStore';

const DesignBoard: React.FC = () => {
  const { designBoardId } = useParams({ from: '/$teamId/design/$designProjectId/$designBoardId/' });

  const pageId = `design-board-${designBoardId}`;

  return (
    <ViewStoreProvider createStore={createViewStore}>
      <VinesView id={pageId} pageId={pageId} type={'design-board'} designBoardId={designBoardId} />
    </ViewStoreProvider>
  );
};

export const Route = createLazyFileRoute('/$teamId/design/$designProjectId/$designBoardId/')({
  component: DesignBoard,
});
