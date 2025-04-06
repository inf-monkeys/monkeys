import React, { useEffect, useMemo } from 'react';

import { createLazyFileRoute } from '@tanstack/react-router';

import { useSystemConfig } from '@/apis/common';
import { WorkbenchSidebar } from '@/components/layout/workbench/sidebar';
import { WorkbenchView } from '@/components/layout/workbench/view';
import useUrlState from '@/hooks/use-url-state.ts';
import { usePageStore } from '@/store/usePageStore';

export const Workbench: React.FC = () => {
  const setWorkbenchVisible = usePageStore((s) => s.setWorkbenchVisible);

  const { data: oem } = useSystemConfig();

  const [{ mode, showGroup: urlShowGroup }] = useUrlState<{ mode: 'normal' | 'fast' | 'mini'; showGroup: boolean }>({
    mode: 'normal',
    showGroup: false,
  });

  const showGroup = oem?.theme.showSidebarPageGroup ?? urlShowGroup;

  useEffect(() => {
    setTimeout(() => setWorkbenchVisible(true), 80);
  }, []);

  useMemo(() => {
    window['sideBarMode'] = mode;
    window['sideBarShowGroup'] = showGroup;
  }, [mode, showGroup]);

  return (
    <main className="flex size-full">
      <WorkbenchSidebar mode={mode} showGroup={showGroup} />
      <WorkbenchView mode={mode} />
    </main>
  );
};

export const Route = createLazyFileRoute('/$teamId/workbench/')({
  component: Workbench,
});
