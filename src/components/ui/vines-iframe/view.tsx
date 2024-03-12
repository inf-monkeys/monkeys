import React, { useMemo } from 'react';

import { motion } from 'framer-motion';

import { Page404 } from '@/components/layout/workspace/404.tsx';
import { IFRAME_MAP } from '@/components/ui/vines-iframe/consts.ts';
import { IVinesIFramePropsRequired } from '@/components/ui/vines-iframe/index.tsx';
import { createVinesCore } from '@/package/vines-flow';

interface IVinesViewProps<P extends IVinesIFramePropsRequired> {
  id?: string;
  workflowId?: string;
  page?: P | null;
  type?: string;
}

export function VinesView<P extends IVinesIFramePropsRequired>({ id, workflowId, page, type }: IVinesViewProps<P>) {
  const View = IFRAME_MAP[type ?? ''];

  const content = useMemo(() => {
    if (!page || !workflowId) return <Page404 />;
    const { VinesProvider } = createVinesCore(workflowId);
    return (
      <VinesProvider>
        <View workflowId={workflowId} />
      </VinesProvider>
    );
  }, [page, workflowId]);

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
      animate={id === page?._id ? 'enter' : 'exit'}
      className="absolute left-0 top-0 size-full"
    >
      {content}
    </motion.div>
  );
}
