import React, { useEffect, useState } from 'react';

import { AnimatePresence } from 'framer-motion';

import { VinesView } from '@/components/ui/vines-iframe/view.tsx';

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
        renderer
          .filter(({ teamId, workflowId, type }) => teamId && workflowId && type)
          .map(({ id, workflowId, type }) => {
            return <VinesView id={id} workflowId={workflowId} pageId={currentPageId} type={type} key={id} />;
          })}
    </AnimatePresence>
  );
};
