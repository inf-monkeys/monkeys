import React, { useEffect, useMemo, useState } from 'react';

import { AnimatePresence } from 'framer-motion';
import { groupBy, reduce } from 'lodash';

import { VinesView } from '@/components/ui/vines-iframe/view';
import { VinesFlowProvider } from '@/components/ui/vines-iframe/view/vines-flow-provider';
import { createViewStore, useViewStore, ViewStoreProvider } from '@/store/useViewStore';
import { getI18nContent } from '@/utils';

// 辅助组件：在 ViewStore 内部设置 workspaceName
const SetWorkspaceNameWrapper: React.FC<{
  workspaceName?: string;
  children: React.ReactNode;
}> = ({ workspaceName, children }) => {
  const setWorkspaceName = useViewStore((s) => s.setWorkspaceName);
  const setFrom = useViewStore((s) => s.setFrom);

  useEffect(() => {
    if (workspaceName) {
      setWorkspaceName(workspaceName);
    }
  }, [workspaceName, setWorkspaceName]);

  useEffect(() => {
    setFrom('workbench');
  }, [setFrom]);

  return <>{children}</>;
};

export interface IVinesIFramePropsRequired {
  id?: string;
  teamId?: string;
  workflowId?: string;
  agentId?: string;
  designMetadataId?: string;
  type?: string;
  iframeUrl?: string;
}

interface IVinesIFrameProps<P extends IVinesIFramePropsRequired> extends React.ComponentPropsWithoutRef<'div'> {
  pages: P[];
  page?: P | null;
  from?: string;
  workspaceName?: string;
}

export const VinesIFrame = <P extends IVinesIFramePropsRequired>({
  page,
  pages,
  from,
  workspaceName: workspaceNameProp,
}: IVinesIFrameProps<P>) => {
  const hasPages = (pages?.length ?? 0) > 0;
  const [renderer, setRenderer] = useState<P[]>([]);

  useEffect(() => {
    if (!page) return;
    if (renderer.findIndex(({ id }) => id === page.id) === -1) {
      // 为了image detail route 取消神奇优化，
      setRenderer(() => [page]);
    }
  }, [page]);

  useEffect(() => {
    if (!hasPages) return;
    setRenderer((prev_) => {
      if (!pages) return prev_;
      return prev_.filter((it) => pages.find(({ id }) => id === it.id));
    });
  }, [pages]);

  const currentPageId = page?.id;

  // workspaceName 优先使用 prop（由 WorkbenchView 计算传入）
  // 如果没有 prop 则尝试从 page 中计算（向后兼容）
  const workspaceName = useMemo(() => {
    if (workspaceNameProp) return workspaceNameProp;

    if (from !== 'workbench' || !page) return undefined;
    // 回退逻辑：如果 page 有额外信息，从中提取
    const groupDisplayName = (page as any)?.groupDisplayName;
    if (groupDisplayName) {
      return getI18nContent(groupDisplayName) || undefined;
    }
    const displayName = (page as any)?.displayName;
    return getI18nContent(displayName) || undefined;
  }, [workspaceNameProp, from, page]);

  const { globalGroups, agents, workflows, designBoards, iframeGroups } = useMemo(() => {
    const mixinGroups = groupBy(renderer, (it) => it?.type ?? '');

    const { globalGroups, agentGroups, workflowGroups, designBoardGroups, iframeGroups } = reduce(
      mixinGroups,
      (acc, group, type) => {
        if (type.startsWith('agent')) {
          acc.agentGroups[type] = group;
        } else if (type === 'design-board') {
          acc.designBoardGroups[type] = group;
        } else if (type.startsWith('global-')) {
          acc.globalGroups[type] = group;
        } else if (type === 'iframe') {
          acc.iframeGroups[type] = group;
        } else if (group.some((item) => item.workflowId)) {
          acc.workflowGroups[type] = group;
        }
        return acc;
      },
      { globalGroups: {}, agentGroups: {}, workflowGroups: {}, designBoardGroups: {}, iframeGroups: {} },
    );

    return {
      globalGroups: Object.entries(globalGroups) as [string, P[]][],
      agents: Object.entries(agentGroups) as [string, P[]][],
      workflows: Object.entries(workflowGroups) as [string, P[]][],
      designBoards: Object.entries(designBoardGroups) as [string, P[]][],
      iframeGroups: Object.entries(iframeGroups) as [string, P[]][],
    };
  }, [renderer]);

  return (
    <AnimatePresence>
      {hasPages && (
        <>
          {page && !(page as any).groupId && (
            <ViewStoreProvider key="global-design-board" createStore={createViewStore}>
              <VinesView id="global-design-board" pageId={currentPageId} type="global-design-board" from={from} />
            </ViewStoreProvider>
          )}
          {globalGroups.map(([_, pages]) => {
            return pages.map(({ id, type }) => (
              <ViewStoreProvider key={id} createStore={createViewStore}>
                <VinesView id={id} pageId={currentPageId} type={type} from={from} />
              </ViewStoreProvider>
            ));
          })}
          {iframeGroups.map(([_, pages]) => {
            return pages.map(({ id, type, iframeUrl }) => (
              <ViewStoreProvider key={id} createStore={createViewStore}>
                <VinesView id={id} pageId={currentPageId} type={type} from={from} iframeUrl={iframeUrl} />
              </ViewStoreProvider>
            ));
          })}
          {workflows.map(([_, pages]) => (
            <VinesFlowProvider key={pages[0].workflowId} workflowId={pages[0].workflowId ?? _}>
              {pages.map(({ id, type, workflowId }) => (
                <ViewStoreProvider key={id} createStore={createViewStore}>
                  <SetWorkspaceNameWrapper workspaceName={workspaceName}>
                    <VinesView id={id} workflowId={workflowId} pageId={currentPageId} type={type} from={from} />
                  </SetWorkspaceNameWrapper>
                </ViewStoreProvider>
              ))}
            </VinesFlowProvider>
          ))}
          {agents.map(([_, pages]) => {
            return pages.map(({ id, type, agentId }) => (
              <ViewStoreProvider key={id} createStore={createViewStore}>
                <VinesView id={id} agentId={agentId} pageId={currentPageId} type={type} from={from} />
              </ViewStoreProvider>
            ));
          })}
          {designBoards.map(([_, pages]) => {
            return pages.map(({ id, designMetadataId, type }) => (
              <ViewStoreProvider key={id} createStore={createViewStore}>
                <VinesView id={id} designBoardId={designMetadataId} pageId={currentPageId} type={type} from={from} />
              </ViewStoreProvider>
            ));
          })}
        </>
      )}
    </AnimatePresence>
  );
};
