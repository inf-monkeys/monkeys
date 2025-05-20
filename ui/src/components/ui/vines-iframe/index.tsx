import React, { useEffect, useMemo, useState } from 'react';

import { AnimatePresence } from 'framer-motion';
import { groupBy, has, reduce } from 'lodash';

import { VinesView } from '@/components/ui/vines-iframe/view';
import { VinesFlowProvider } from '@/components/ui/vines-iframe/view/vines-flow-provider';
import { createViewStore, ViewStoreProvider } from '@/store/useViewStore';

export interface IVinesIFramePropsRequired {
  id?: string;
  teamId?: string;
  workflowId?: string;
  agentId?: string;
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

  const { agents, workflows } = useMemo(() => {
    const mixinGroups = groupBy(renderer, (it) => it?.workflowId ?? it?.agentId ?? '');
    const { agentGroups, workflowGroups } = reduce(
      mixinGroups,
      (acc, group, key) => {
        has(group[0], 'workflowId') ? (acc.workflowGroups[key] = group) : (acc.agentGroups[key] = group);
        return acc;
      },
      { agentGroups: {}, workflowGroups: {} },
    );
    return {
      agents: Object.entries(agentGroups) as [string, P[]][],
      workflows: Object.entries(workflowGroups) as [string, P[]][],
    };
  }, [renderer]);

  return (
    <AnimatePresence>
      {hasPages && (
        <>
          {workflows.map(([workflowId, pages]) => (
            <VinesFlowProvider key={workflowId} workflowId={workflowId}>
              {pages.map(({ id, type }) => (
                <ViewStoreProvider key={id} createStore={createViewStore}>
                  <VinesView id={id} workflowId={workflowId} pageId={currentPageId} type={type} />
                </ViewStoreProvider>
              ))}
            </VinesFlowProvider>
          ))}
          {agents.map(([agentId, pages]) => {
            return pages.map(({ id, type }) => (
              <ViewStoreProvider key={id} createStore={createViewStore}>
                <VinesView id={id} agentId={agentId} pageId={currentPageId} type={type} />
              </ViewStoreProvider>
            ));
          })}
        </>
      )}
    </AnimatePresence>
  );
};
