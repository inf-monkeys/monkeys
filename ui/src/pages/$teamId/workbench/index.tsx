import React, { useEffect, useLayoutEffect } from 'react';

import { createFileRoute } from '@tanstack/react-router';

import { WorkbenchSidebar } from '@/components/layout/workbench/sidebar';
import { WorkbenchView } from '@/components/layout/workbench/view';
import { teamIdGuard } from '@/components/router/guard/team-id.ts';
import { usePageStore } from '@/store/usePageStore';
import VinesEvent from '@/utils/events.ts';

export const Workbench: React.FC = () => {
  const { setWorkbenchVisible } = usePageStore();

  useLayoutEffect(() => {
    // Tips: 不是每个页面都需要手动设置标题
    VinesEvent.emit('vines-update-site-title', '工作台');
  }, []);

  useEffect(() => {
    setWorkbenchVisible(true);
    return () => {
      setWorkbenchVisible(false);
    };
  }, []);

  return (
    <main className="flex size-full">
      <WorkbenchSidebar />
      <WorkbenchView />
    </main>
  );
};

export const Route = createFileRoute('/$teamId/workbench/')({
  component: Workbench,
  beforeLoad: teamIdGuard,
});
