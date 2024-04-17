import React, { useEffect } from 'react';

import { createFileRoute, useNavigate } from '@tanstack/react-router';

import { teamIdGuard } from '@/components/router/guard/team-id.ts';

export const Workspace: React.FC = () => {
  const navigate = useNavigate();

  useEffect(() => {
    // 此路径不需要没有任何意义，跳转到团队首页
    void navigate({
      to: '/$teamId',
    });
  }, []);

  return null;
};

export const Route = createFileRoute('/$teamId/workspace/')({
  component: Workspace,
  beforeLoad: teamIdGuard,
});
