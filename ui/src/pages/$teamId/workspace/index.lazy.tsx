import React, { useEffect } from 'react';

import { createLazyFileRoute } from '@tanstack/react-router';

import { useVinesTeam } from '@/components/router/guard/team.tsx';
import VinesEvent from '@/utils/events.ts';

export const Workspace: React.FC = () => {
  const { teamId } = useVinesTeam();

  useEffect(() => {
    // 此路径不需要没有任何意义，跳转到团队首页
    VinesEvent.emit('vines-nav', '/$teamId', { teamId });
  }, [teamId]);

  return null;
};

export const Route = createLazyFileRoute('/$teamId/workspace/')({
  component: Workspace,
});
