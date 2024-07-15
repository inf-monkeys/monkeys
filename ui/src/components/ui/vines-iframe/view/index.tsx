/* eslint-disable react-hooks/rules-of-hooks */
import React, { useEffect, useMemo } from 'react';

import { motion } from 'framer-motion';

import { Page404 } from '@/components/layout/workspace/404.tsx';
import { VinesViewWrapper } from '@/components/layout-wrapper/workspace/view-wrapper.tsx';
import { IFRAME_MAP } from '@/components/ui/vines-iframe/consts.ts';
import { CanvasStoreProvider, createCanvasStore } from '@/store/useCanvasStore';
import { createFlowStore, FlowStoreProvider } from '@/store/useFlowStore';
import { useViewStore } from '@/store/useViewStore';

interface IVinesViewProps {
  id?: string;
  workflowId?: string;
  pageId?: string;
  type?: string;
}

export function VinesView({ id, workflowId, pageId, type }: IVinesViewProps) {
  const { setVisible } = useViewStore();

  if (!((type ?? '') in IFRAME_MAP)) {
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
        <Page404 />
      </motion.div>
    );
  }

  const View = IFRAME_MAP[type ?? ''];

  const content = useMemo(() => {
    if (!id) return <Page404 />;
    return (
      <FlowStoreProvider createStore={createFlowStore}>
        <CanvasStoreProvider createStore={createCanvasStore}>
          <VinesViewWrapper workflowId={workflowId}>
            <View />
          </VinesViewWrapper>
        </CanvasStoreProvider>
      </FlowStoreProvider>
    );
  }, [id]);

  useEffect(() => {
    const finalVisible = id === pageId;
    setTimeout(() => setVisible(finalVisible), finalVisible ? 0 : 216);
  }, [pageId, id]);

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
