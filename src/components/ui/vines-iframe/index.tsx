import React, { useEffect, useState } from 'react';

import { AnimatePresence } from 'framer-motion';
import { groupBy } from 'lodash';

import { VinesView } from '@/components/ui/vines-iframe/view';
import { VinesFlowProvider } from '@/components/ui/vines-iframe/view/vines-flow-provider.tsx';
import { createViewStore, ViewStoreProvider } from '@/store/useViewStore';

export interface IVinesIFramePropsRequired {
  _id?: string;
  teamId?: string;
  workflowId?: string;
  type?: string;
}

interface IVinesIFrameProps<P extends IVinesIFramePropsRequired> extends React.ComponentPropsWithoutRef<'div'> {
  pages: P[];
  page?: P | null;
}

export const VinesIFrame = <P extends IVinesIFramePropsRequired>({ page, pages }: IVinesIFrameProps<P>) => {
  const hasPages = (pages?.length ?? 0) > 0;
  const [renderer, setRenderer] = useState<P[]>([]);

  useEffect(() => {
    if (!page) return;
    if (renderer.findIndex(({ _id }) => _id === page._id) === -1) {
      setRenderer((prev) => [...prev, page]);
    }
  }, [page]);

  useEffect(() => {
    if (!hasPages) return;
    setRenderer((prev) => {
      if (!pages) return prev;
      return prev.filter((it) => pages.find(({ _id }) => _id === it._id));
    });
  }, [pages]);

  const currentPageId = page?._id;

  return (
    <AnimatePresence>
      {hasPages &&
        Object.entries(groupBy(renderer, 'workflowId')).map(([workflowId, pages]) => {
          return (
            <VinesFlowProvider key={workflowId} workflowId={workflowId}>
              {pages.map(({ _id, type }) => (
                <ViewStoreProvider key={_id} createStore={createViewStore}>
                  <VinesView id={_id} workflowId={workflowId} pageId={currentPageId} type={type} />
                </ViewStoreProvider>
              ))}
            </VinesFlowProvider>
          );
        })}
    </AnimatePresence>
  );
};
