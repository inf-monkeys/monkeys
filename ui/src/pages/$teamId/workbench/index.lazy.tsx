import React, { useEffect, useState } from 'react';

import { createLazyFileRoute } from '@tanstack/react-router';

import { get } from 'lodash';

import { useSystemConfig } from '@/apis/common';
import { HistoryResult } from '@/components/layout/workbench/history';
import { WorkbenchSidebar } from '@/components/layout/workbench/sidebar';
import { TemporaryWorkflowOverlay } from '@/components/layout/workbench/temporary-workflow-overlay';
import { WorkbenchView } from '@/components/layout/workbench/view';
import useUrlState from '@/hooks/use-url-state.ts';
import { useGlobalViewSize, useSidebarCollapsed } from '@/store/useGlobalViewStore';
import { usePageStore } from '@/store/usePageStore';

export const Workbench: React.FC = () => {
  const setWorkbenchVisible = usePageStore((s) => s.setWorkbenchVisible);
  const sidebarCollapsed = useSidebarCollapsed();
  const { data: oem } = useSystemConfig();

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
    <main className="relative flex size-full gap-global">
      <WorkbenchSidebar mode={mode} showGroup={showGroup} collapsed={sidebarCollapsed} />
      <div className={`flex size-full flex-col gap-global ${sidebarCollapsed ? 'flex-1' : ''}`}>
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
