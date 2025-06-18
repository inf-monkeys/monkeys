/* eslint-disable react-hooks/rules-of-hooks */
import { useEffect } from 'react';

import { useCreation } from 'ahooks';
import { motion } from 'framer-motion';

import { VinesAgentViewWrapper } from '@/components/layout-wrapper/agent/view-wrapper.tsx';
import { VinesDesignBoardViewWrapper } from '@/components/layout-wrapper/design/view-wrapper.tsx';
import { VinesViewWrapper } from '@/components/layout-wrapper/workspace/view-wrapper.tsx';
import { Page404 } from '@/components/layout/workspace/404.tsx';
import { useVinesRoute } from '@/components/router/use-vines-route';
import { IFRAME_MAP } from '@/components/ui/vines-iframe/consts.ts';
import { AgentStoreProvider, createAgentStore } from '@/store/useAgentStore';
import { CanvasStoreProvider, createCanvasStore } from '@/store/useCanvasStore';
import { createDesignBoardStore, DesignBoardProvider } from '@/store/useDesignBoardStore';
import { createFlowStore, FlowStoreProvider } from '@/store/useFlowStore';
import { createOutputSelectionStore, OutputSelectionStoreProvider } from '@/store/useOutputSelectionStore';
import { useViewStore } from '@/store/useViewStore';

import { VinesViewFrame } from './frame';
import { WorkbenchOperationBar } from './operation-bar';

interface IVinesViewProps {
  id?: string;
  designBoardId?: string;
  workflowId?: string;
  agentId?: string;
  pageId?: string;
  type?: string;
}

export function VinesView({ id, designBoardId, workflowId, agentId, pageId, type }: IVinesViewProps) {
  const setVisible = useViewStore((s) => s.setVisible);

  const { isUseWorkbench } = useVinesRoute();

  if (!((type ?? '') in IFRAME_MAP)) {
    return (
      <VinesViewFrame>
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
          className="absolute left-12 top-0 size-full"
        >
          <Page404 />
        </motion.div>
      </VinesViewFrame>
    );
  }

  const View = IFRAME_MAP[type ?? ''];

  const content = useCreation(() => {
    if (!id) return <Page404 />;

    if (designBoardId) {
      return (
        <DesignBoardProvider createStore={createDesignBoardStore}>
          <VinesDesignBoardViewWrapper designBoardId={designBoardId}>
            <VinesViewFrame>
              <View />
            </VinesViewFrame>
          </VinesDesignBoardViewWrapper>
        </DesignBoardProvider>
      );
    }

    if (workflowId) {
      return (
        <FlowStoreProvider createStore={createFlowStore}>
          <CanvasStoreProvider createStore={createCanvasStore}>
            <VinesViewWrapper workflowId={workflowId}>
              {type === 'preview' ? (
                <OutputSelectionStoreProvider createStore={createOutputSelectionStore}>
                  {isUseWorkbench ? (
                    <div className="flex size-full gap-4">
                      <VinesViewFrame>
                        <View />
                      </VinesViewFrame>
                      <WorkbenchOperationBar />
                    </div>
                  ) : (
                    <VinesViewFrame>
                      <View />
                    </VinesViewFrame>
                  )}
                </OutputSelectionStoreProvider>
              ) : (
                <VinesViewFrame>
                  <View />
                </VinesViewFrame>
              )}
            </VinesViewWrapper>
          </CanvasStoreProvider>
        </FlowStoreProvider>
      );
    }

    return (
      <AgentStoreProvider createStore={createAgentStore}>
        <VinesAgentViewWrapper agentId={agentId}>
          <VinesViewFrame>
            <View />
          </VinesViewFrame>
        </VinesAgentViewWrapper>
      </AgentStoreProvider>
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
