import React, { useEffect } from 'react';

import { createLazyFileRoute } from '@tanstack/react-router';

import { HistoryResult } from '@/components/layout/workbench/history';
import { WorkbenchSidebar } from '@/components/layout/workbench/sidebar';
import { WorkbenchView } from '@/components/layout/workbench/view';
import useUrlState from '@/hooks/use-url-state.ts';
import { useGlobalViewSize, useSidebarCollapsed } from '@/store/useGlobalViewStore';
import { usePageStore } from '@/store/usePageStore';

export const Workbench: React.FC = () => {
  const setWorkbenchVisible = usePageStore((s) => s.setWorkbenchVisible);
  const sidebarCollapsed = useSidebarCollapsed();
  // const { data: oem } = useSystemConfig();

  const [{ mode }] = useUrlState<{ mode: 'normal' | 'fast' | 'mini'; showGroup: boolean }>({
    mode: 'normal',
    showGroup: false,
  });

  // const showGroup = oem?.theme.showSidebarPageGroup ?? urlShowGroup;
  const showGroup = true;

  useEffect(() => {
    setTimeout(() => setWorkbenchVisible(true), 80);
  }, []);

  useEffect(() => {
    window['sideBarMode'] = mode;
    window['sideBarShowGroup'] = showGroup;
  }, [mode, showGroup]);

  const globalViewSize = useGlobalViewSize();

  return (
    <main className="relative flex size-full gap-global">
      <WorkbenchSidebar mode={mode} showGroup={showGroup} collapsed={sidebarCollapsed} />
      <div className={`flex size-full flex-col gap-global ${sidebarCollapsed ? 'flex-1' : ''}`}>
        <WorkbenchView mode={mode} />
        {mode !== 'mini' && globalViewSize !== 'sm' && <HistoryResult />}
      </div>
    </main>
  );
};

export const Route = createLazyFileRoute('/$teamId/workbench/')({
  component: Workbench,
});
