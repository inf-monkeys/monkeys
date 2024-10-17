import React, { useEffect, useState } from 'react';

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

  const [groupId, setGroupId] = useState<string>('default');

  return (
    <main className="flex size-full">
      <WorkbenchSidebar groupId={groupId} setGroupId={setGroupId} mode={mode} />
      <WorkbenchView groupId={groupId} mode={mode} />
    </main>
  );
};

export const Route = createLazyFileRoute('/$teamId/workbench/')({
  component: Workbench,
});
