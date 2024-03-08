import React, { useCallback, useEffect, useState } from 'react';

import { CircularProgress } from '@nextui-org/progress';
import { AnimatePresence, motion } from 'framer-motion';

import { cn } from '@/utils';
import { useRetimer } from '@/utils/use-retimer.ts';

interface IVinesIFramePropsRequired {
  _id?: string;
  teamId?: string;
  workflowId?: string;
  type?: string;
}

interface IVinesIFrameProps<P extends IVinesIFramePropsRequired> extends React.ComponentPropsWithoutRef<'div'> {
  pages: P[];
  page: P;
}

export const VinesIFrame = <P extends IVinesIFramePropsRequired>({ page, pages }: IVinesIFrameProps<P>) => {
  const hasPages = (pages?.length ?? 0) > 0;

  const reTimer = useRetimer();

  const [loading, setLoading] = useState(true);
  const [renderer, setRenderer] = useState<P[]>([]);

  useEffect(() => {
    if (!page) return;
    if (renderer.findIndex(({ _id }) => _id === page._id) === -1) {
      setLoading(true);
      setTimeout(() => setRenderer((prev) => [...prev, page]), 192);
    }
  }, [page]);

  useEffect(() => {
    if (!hasPages) return;
    setRenderer((prev) => {
      if (!pages) return prev;
      return prev.filter((it) => pages.find(({ _id }) => _id === it._id));
    });
  }, [pages]);

  const handleToggleLoading = useCallback(
    (status?: boolean, wait = 1000) => {
      reTimer(setTimeout(() => setLoading(status ?? !loading), wait) as unknown as number);
    },
    [reTimer],
  );

  return (
    <AnimatePresence>
      {hasPages &&
        renderer
          .filter(({ teamId, workflowId, type }) => teamId && workflowId && type)
          .map((it) => (
            <motion.iframe
              key={it._id}
              src={`/${it.teamId}/workspace/${it.workflowId}/vines-${it.type}`}
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
              animate={it._id === page?._id ? 'enter' : 'exit'}
              className={cn('absolute left-0 top-0 h-full w-full', { hidden: loading })}
              onLoadStart={() => setLoading(true)}
              onLoad={() => handleToggleLoading(false)}
            />
          ))}
      {(loading || !hasPages) && (
        <motion.div
          key="vines-iframe-waiting"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1, transition: { duration: 0.2 } }}
          exit={{ opacity: 0, transition: { duration: 0.2 } }}
          transition={{ type: 'linear' }}
          className="vines-center absolute left-0 top-0 size-full bg-slate-1"
        >
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1, transition: { delay: 0.38 } }}>
            <CircularProgress className="[&_circle:last-child]:stroke-vines-500" size="lg" aria-label="Loading..." />
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
