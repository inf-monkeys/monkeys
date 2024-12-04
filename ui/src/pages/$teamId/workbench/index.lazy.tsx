import React, { useEffect } from 'react';

import { createLazyFileRoute } from '@tanstack/react-router';

import { WorkbenchSidebar } from '@/components/layout/workbench/sidebar';
import { WorkbenchView } from '@/components/layout/workbench/view';
import useUrlState from '@/hooks/use-url-state.ts';
import { usePageStore } from '@/store/usePageStore';

export const Workbench: React.FC = () => {
  const setWorkbenchVisible = usePageStore((s) => s.setWorkbenchVisible);

  const [{ mode }] = useUrlState<{ mode: 'normal' | 'fast' | 'mini' }>({ mode: 'normal' });

  useEffect(() => {
    setTimeout(() => setWorkbenchVisible(true), 80);
  }, []);

  return (
    <main className="flex size-full">
      <WorkbenchSidebar mode={mode} />
      <WorkbenchView mode={mode} />
    </main>
  );
};

export const Route = createLazyFileRoute('/$teamId/workbench/')({
  component: Workbench,
});
