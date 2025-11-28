import React, { useEffect, useState } from 'react';

import { createLazyFileRoute } from '@tanstack/react-router';

import { get } from 'lodash';

import { useSystemConfig } from '@/apis/common';
import { CustomizationWorkbenchViewTheme } from '@/apis/common/typings';
import { HistoryResult } from '@/components/layout/workbench/history';
import { WorkbenchSidebar } from '@/components/layout/workbench/sidebar';
import { TemporaryWorkflowOverlay } from '@/components/layout/workbench/temporary-workflow-overlay';
import { WorkbenchView } from '@/components/layout/workbench/view';
import useUrlState from '@/hooks/use-url-state.ts';
import { useGlobalViewSize, useSidebarCollapsed } from '@/store/useGlobalViewStore';
import { usePageStore } from '@/store/usePageStore';
import { cn } from '@/utils';

export const Workbench: React.FC = () => {
  const setWorkbenchVisible = usePageStore((s) => s.setWorkbenchVisible);
  const sidebarCollapsed = useSidebarCollapsed();
  const { data: oem } = useSystemConfig();

  const showWorkbenchSidebar = get(oem, 'theme.showWorkbenchSidebar', true) as boolean;
  const workbenchViewTheme = get(oem, 'theme.workbenchViewTheme', 'default') as CustomizationWorkbenchViewTheme;
  const showHistoryResult = get(oem, 'theme.historyResult.display', false) as boolean;

  const [{ mode, temporaryWorkflowId }] = useUrlState<{
    mode: 'normal' | 'fast' | 'mini';
    showGroup: boolean;
    temporaryWorkflowId?: string;
  }>({
    mode: 'normal',
    showGroup: false,
    temporaryWorkflowId: undefined,
  });

  const showGroup = true;

  useEffect(() => {
    setTimeout(() => setWorkbenchVisible(true), 80);
  }, []);

  useEffect(() => {
    window['sideBarMode'] = mode;
    window['sideBarShowGroup'] = showGroup;
  }, [mode, showGroup]);

  const globalViewSize = useGlobalViewSize();

  const [temporaryWorkflowDialogOpen, setTemporaryWorkflowDialogOpen] = useState(false);

  useEffect(() => {
    if (temporaryWorkflowId) {
      setTemporaryWorkflowDialogOpen(true);
    }
  }, [temporaryWorkflowId]);

  return (
    <main className={cn('relative flex size-full', mode != 'mini' && showWorkbenchSidebar && 'gap-global')}>
      {showWorkbenchSidebar && <WorkbenchSidebar mode={mode} showGroup={showGroup} collapsed={sidebarCollapsed} />}
      <div
        className={cn(
          'flex size-full flex-col gap-global',
          (sidebarCollapsed || !showWorkbenchSidebar) && 'flex-1',
          workbenchViewTheme === 'bsd-blue' && 'rounded-lg',
        )}
        style={
          workbenchViewTheme === 'bsd-blue'
            ? {
                background: 'rgba(43, 93, 241, 0.08)',
                boxSizing: 'border-box',
                backdropFilter: 'blur(16px)',
              }
            : undefined
        }
      >
        <WorkbenchView mode={mode} />
        {mode !== 'mini' && globalViewSize !== 'sm' && showHistoryResult && <HistoryResult />}
      </div>
      <TemporaryWorkflowOverlay
        mode={mode}
        temporaryWorkflowId={temporaryWorkflowId}
        open={temporaryWorkflowDialogOpen}
        setOpen={setTemporaryWorkflowDialogOpen}
      />
    </main>
  );
};

export const Route = createLazyFileRoute('/$teamId/workbench/')({
  component: Workbench,
});
