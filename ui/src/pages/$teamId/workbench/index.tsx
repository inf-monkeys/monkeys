import React, { useEffect, useRef, useState } from 'react';

import { createFileRoute } from '@tanstack/react-router';

import { WorkbenchSidebar } from '@/components/layout/workbench/sidebar';
import { WorkbenchView } from '@/components/layout/workbench/view';
import { useVinesTeam } from '@/components/router/guard/team.tsx';
import { teamIdGuard } from '@/components/router/guard/team-id.ts';
import { usePageStore } from '@/store/usePageStore';

export const Workbench: React.FC = () => {
  const setWorkbenchVisible = usePageStore((s) => s.setWorkbenchVisible);

  useEffect(() => {
    setWorkbenchVisible(true);
  }, []);

  const { teamId } = useVinesTeam();

  const [refresh, setRefresh] = useState(false);
  const currentTeamId = useRef<string>();
  useEffect(() => {
    if (!teamId) return;
    const teamIdRef = currentTeamId.current;
    if (teamIdRef && teamIdRef !== teamId) {
      setRefresh(true);
      setTimeout(() => setRefresh(false), 180);
    }
    currentTeamId.current = teamId;
  }, [teamId]);

  const [groupId, setGroupId] = useState<string>('default');

  return (
    <main className="flex size-full">
      <WorkbenchSidebar groupId={groupId} setGroupId={setGroupId} />
      {!refresh && <WorkbenchView groupId={groupId} />}
    </main>
  );
};

export const Route = createFileRoute('/$teamId/workbench/')({
  component: Workbench,
  beforeLoad: teamIdGuard,
});
