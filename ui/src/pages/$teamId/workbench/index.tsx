import React, { useEffect } from 'react';

import { createFileRoute } from '@tanstack/react-router';

import { WorkbenchSidebar } from '@/components/layout/workbench/sidebar';
import { WorkbenchView } from '@/components/layout/workbench/view';
import { teamIdGuard } from '@/components/router/guard/team-id.ts';
import { usePageStore } from '@/store/usePageStore';

export const Workbench: React.FC = () => {
  const { setWorkbenchVisible } = usePageStore();

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
