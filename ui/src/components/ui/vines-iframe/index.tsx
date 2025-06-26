import React, { useEffect, useMemo, useState } from 'react';

import { AnimatePresence } from 'framer-motion';
import { groupBy, reduce } from 'lodash';

import { VinesView } from '@/components/ui/vines-iframe/view';
import { VinesFlowProvider } from '@/components/ui/vines-iframe/view/vines-flow-provider';
import { createViewStore, ViewStoreProvider } from '@/store/useViewStore';

export interface IVinesIFramePropsRequired {
  id?: string;
  teamId?: string;
  workflowId?: string;
  agentId?: string;
  designMetadataId?: string;
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
      // 为了image detail route 取消神奇优化，
      setRenderer((prev) => [page]);
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

  const { globalGroups, agents, workflows, designBoards } = useMemo(() => {
    const mixinGroups = groupBy(renderer, (it) => it?.type ?? '');
    const { globalGroups, agentGroups, workflowGroups, designBoardGroups } = reduce(
      mixinGroups,
      (acc, group, type) => {
        if (type.startsWith('agent')) {
          acc.agentGroups[type] = group;
        } else if (group.some((item) => item.workflowId)) {
          acc.workflowGroups[type] = group;
        } else if (type === 'design-board') {
          acc.designBoardGroups[type] = group;
        } else if (type.startsWith('global-')) {
          acc.globalGroups[type] = group;
        }
        return acc;
      },
      { globalGroups: {}, agentGroups: {}, workflowGroups: {}, designBoardGroups: {} },
    );
    return {
      globalGroups: Object.entries(globalGroups) as [string, P[]][],
      agents: Object.entries(agentGroups) as [string, P[]][],
      workflows: Object.entries(workflowGroups) as [string, P[]][],
      designBoards: Object.entries(designBoardGroups) as [string, P[]][],
    };
  }, [renderer]);

  return (
    <AnimatePresence>
      {hasPages && (
        <>
          {globalGroups.map(([_, pages]) => {
            return pages.map(({ id, type }) => (
              <ViewStoreProvider key={id} createStore={createViewStore}>
                <VinesView id={id} pageId={currentPageId} type={type} />
              </ViewStoreProvider>
            ));
          })}
          {workflows.map(([_, pages]) => (
            <VinesFlowProvider key={pages[0].workflowId} workflowId={pages[0].workflowId ?? _}>
              {pages.map(({ id, type, workflowId }) => (
                <ViewStoreProvider key={id} createStore={createViewStore}>
                  <VinesView id={id} workflowId={workflowId} pageId={currentPageId} type={type} />
                </ViewStoreProvider>
              ))}
            </VinesFlowProvider>
          ))}
          {agents.map(([_, pages]) => {
            return pages.map(({ id, type, agentId }) => (
              <ViewStoreProvider key={id} createStore={createViewStore}>
                <VinesView id={id} agentId={agentId} pageId={currentPageId} type={type} />
              </ViewStoreProvider>
            ));
          })}
          {designBoards.map(([_, pages]) => {
            return pages.map(({ id, designMetadataId, type }) => (
              <ViewStoreProvider key={id} createStore={createViewStore}>
                <VinesView id={id} designBoardId={designMetadataId} pageId={currentPageId} type={type} />
              </ViewStoreProvider>
            ));
          })}
        </>
      )}
    </AnimatePresence>
  );
};
