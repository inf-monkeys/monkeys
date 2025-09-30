/* eslint-disable react-hooks/rules-of-hooks */
import { useEffect } from 'react';

import { useCreation } from 'ahooks';
import { motion } from 'framer-motion';
import { get } from 'lodash';

import { useSystemConfig } from '@/apis/common';
import { Page404 } from '@/components/layout/workspace/404.tsx';
import { VinesAgentViewWrapper } from '@/components/layout-wrapper/agent/view-wrapper.tsx';
import { VinesDesignBoardViewWrapper } from '@/components/layout-wrapper/design/view-wrapper.tsx';
import { VinesViewWrapper } from '@/components/layout-wrapper/workspace/view-wrapper.tsx';
import { useVinesRoute } from '@/components/router/use-vines-route';
import { IFRAME_MAP } from '@/components/ui/vines-iframe/consts.ts';
import useUrlState from '@/hooks/use-url-state';
import { AgentStoreProvider, createAgentStore } from '@/store/useAgentStore';
import { CanvasStoreProvider, createCanvasStore } from '@/store/useCanvasStore';
import { createDesignBoardStore, DesignBoardProvider } from '@/store/useDesignBoardStore';
import { getGlobalDesignBoardStore } from '@/store/useDesignBoardStore/shared';
import { createExecutionStore, ExecutionStoreProvider } from '@/store/useExecutionStore';
import { createFlowStore, FlowStoreProvider } from '@/store/useFlowStore';
import { createOutputSelectionStore, OutputSelectionStoreProvider } from '@/store/useOutputSelectionStore';
import { useViewStore } from '@/store/useViewStore';
import { cn } from '@/utils';
import { IframeWrapper } from '@/view/iframe-wrapper';

import { VinesViewFrame } from './frame';
import { GlobalDesignBoardAssociationBar } from './global-design-board-association-bar';
import { GlobalDesignBoardOperationBar } from './global-design-board-operation-bar';
import { WorkbenchOperationBar } from './operation-bar';

interface IVinesViewProps {
  id?: string;
  designBoardId?: string;
  workflowId?: string;
  agentId?: string;
  pageId?: string;
  type?: string;
  from?: string;
  iframeUrl?: string;
}

export function VinesView({ id, designBoardId, workflowId, agentId, pageId, type, from, iframeUrl }: IVinesViewProps) {
  const setVisible = useViewStore((s) => s.setVisible);
  const setFrom = useViewStore((s) => s.setFrom);

  const { data: oem } = useSystemConfig();

  const showFormEmbed = get(oem, 'theme.workbenchSidebarFormViewEmbed', false) as boolean;

  const [{ mode }] = useUrlState<{ mode: 'normal' | 'fast' | 'mini' }>({ mode: 'normal' });

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

    if (type === 'iframe') {
      return <IframeWrapper iframeUrl={iframeUrl} />;
    }

    if (type === 'global-design-board' || type === 'design-board') {
      return (
        <DesignBoardProvider
          createStore={type === 'global-design-board' ? getGlobalDesignBoardStore : createDesignBoardStore}
        >
          <VinesDesignBoardViewWrapper designBoardId={designBoardId}>
            {type === 'global-design-board' ? (
              <div className={cn('flex size-full gap-global')}>
                {!showFormEmbed && <GlobalDesignBoardOperationBar />}
                <VinesViewFrame>
                  <View />
                </VinesViewFrame>
                <GlobalDesignBoardAssociationBar />
              </div>
            ) : (
              <VinesViewFrame>
                <View />
              </VinesViewFrame>
            )}
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
                <ExecutionStoreProvider createStore={createExecutionStore}>
                  <OutputSelectionStoreProvider createStore={createOutputSelectionStore}>
                    {isUseWorkbench ? (
                      <div className={cn('flex size-full', mode === 'mini' ? 'gap-2' : 'gap-global')}>
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
                </ExecutionStoreProvider>
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
    setTimeout(
      () => {
        setVisible(finalVisible);
      },
      finalVisible ? 0 : 216,
    );
  }, [pageId, id]);

  useEffect(() => {
    setFrom(from);
  }, [from]);

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
