import React, { useEffect } from 'react';

import { createLazyFileRoute } from '@tanstack/react-router';

import { HistoryResult } from '@/components/layout/workbench/history';
import { WorkbenchSidebar } from '@/components/layout/workbench/sidebar';
import { WorkbenchView } from '@/components/layout/workbench/view';
import useUrlState from '@/hooks/use-url-state.ts';
import { usePageStore } from '@/store/usePageStore';

export const Workbench: React.FC = () => {
  const setWorkbenchVisible = usePageStore((s) => s.setWorkbenchVisible);
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

  return (
    <main className="relative flex size-full">
      <WorkbenchSidebar mode={mode} showGroup={showGroup} />
      <div className="flex size-full flex-col">
        <WorkbenchView mode={mode} />
        <HistoryResult />
      </div>
    </main>
  );
};

export const Route = createLazyFileRoute('/$teamId/workbench/')({
  component: Workbench,
});
