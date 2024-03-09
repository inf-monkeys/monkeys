import React, { useEffect, useState } from 'react';

import { AnimatePresence, motion } from 'framer-motion';

import { Page404 } from '@/components/layout/workspace/404.tsx';
import { IFRAME_MAP } from '@/components/ui/vines-iframe/consts.ts';
import { VinesProvider } from '@/package/vines-flow';

interface IVinesIFramePropsRequired {
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
      <VinesProvider>
        {hasPages &&
          renderer
            .filter(({ teamId, workflowId, type }) => teamId && workflowId && type)
            .map(({ _id, type }) => {
              const View = IFRAME_MAP[type ?? ''];
              return (
                <motion.div
                  key={_id}
                  variants={{
                    enter: {
                      opacity: 1,
                      display: 'block',
                    },
                    exit: {
                      opacity: 0,
                      transitionEnd: {
                        display: 'none',
                      },
                    },
                  }}
                  animate={_id === page?._id ? 'enter' : 'exit'}
                  className="absolute left-0 top-0 size-full"
                >
                  {page ? <View /> : <Page404 />}
                </motion.div>
              );
            })}
      </VinesProvider>
    </AnimatePresence>
  );
};
