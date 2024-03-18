import React, { useMemo } from 'react';

import { motion } from 'framer-motion';

import { Page404 } from '@/components/layout/workspace/404.tsx';
import { IFRAME_MAP } from '@/components/ui/vines-iframe/consts.ts';
import { createVinesCore } from '@/package/vines-flow';

interface IVinesViewProps {
  id?: string;
  workflowId?: string;
  pageId?: string;
  type?: string;
}

export function VinesView({ id, workflowId, pageId, type }: IVinesViewProps) {
  const View = IFRAME_MAP[type ?? ''];

  const content = useMemo(() => {
    if (!pageId || !workflowId) return <Page404 />;
    const { VinesProvider } = createVinesCore(workflowId);
    return (
      <VinesProvider>
        <View workflowId={workflowId} />
      </VinesProvider>
    );
  }, [pageId, workflowId]);

  return (
    <motion.div
      key={id}
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
      animate={id === pageId ? 'enter' : 'exit'}
      className="absolute left-0 top-0 size-full"
    >
      {content}
    </motion.div>
  );
}
