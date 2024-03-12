import React, { useEffect, useState } from 'react';

import { AnimatePresence } from 'framer-motion';

import { VinesView } from '@/components/ui/vines-iframe/view.tsx';

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

  return (
    <AnimatePresence mode="wait">
      {hasPages &&
        renderer
          .filter(({ teamId, workflowId, type }) => teamId && workflowId && type)
          .map(({ _id, workflowId, type }) => {
            return <VinesView<P> id={_id} workflowId={workflowId} page={page} type={type} key={_id} />;
          })}
    </AnimatePresence>
  );
};
