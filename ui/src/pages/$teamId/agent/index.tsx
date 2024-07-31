import React, { useEffect } from 'react';

import { createFileRoute } from '@tanstack/react-router';

import { useVinesTeam } from '@/components/router/guard/team.tsx';
import VinesEvent from '@/utils/events.ts';

const Agent: React.FC = () => {
  const { teamId } = useVinesTeam();

  useEffect(() => {
    // 此路径不需要没有任何意义，跳转到智能体页面
    VinesEvent.emit('vines-nav', '/$teamId/agents', { teamId });
  }, [teamId]);

  return null;
};

export const Route = createFileRoute('/$teamId/agent/')({
  component: Agent,
});
