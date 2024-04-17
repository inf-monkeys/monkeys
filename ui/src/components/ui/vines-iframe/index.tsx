import React, { useEffect, useState } from 'react';

import { AnimatePresence } from 'framer-motion';
import { groupBy } from 'lodash';

import { VinesView } from '@/components/ui/vines-iframe/view';
import { VinesFlowProvider } from '@/components/ui/vines-iframe/view/vines-flow-provider.tsx';
import { createViewStore, ViewStoreProvider } from '@/store/useViewStore';

export interface IVinesIFramePropsRequired {
  id?: string;
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
    if (renderer.findIndex(({ id }) => id === page.id) === -1) {
      setRenderer((prev) => [...prev, page]);
    }
  }, [page]);

  useEffect(() => {
    if (!hasPages) return;
    setRenderer((prev) => {
      if (!pages) return prev;
      return prev.filter((it) => pages.find(({ id }) => id === it.id));
    });
  }, [pages]);

  const currentPageId = page?.id;

  return (
    <AnimatePresence>
      {hasPages &&
        Object.entries(groupBy(renderer, 'workflowId')).map(([workflowId, pages]) => {
          return (
            <VinesFlowProvider key={workflowId} workflowId={workflowId}>
              {pages.map(({ id, type }) => (
                <ViewStoreProvider key={id} createStore={createViewStore}>
                  <VinesView id={id} workflowId={workflowId} pageId={currentPageId} type={type} />
                </ViewStoreProvider>
              ))}
            </VinesFlowProvider>
          );
        })}
    </AnimatePresence>
  );
};
