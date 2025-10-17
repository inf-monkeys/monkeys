import React, { useEffect } from 'react';

import { createLazyFileRoute, useNavigate, useParams, useSearch } from '@tanstack/react-router';

import { useSystemConfig } from '@/apis/common';
import { Workbench } from '@/pages/$teamId/workbench/index.lazy.tsx';

const TeamEntry: React.FC = () => {
  const { data: oem } = useSystemConfig();
  const navigate = useNavigate();
  const { teamId } = useParams({ from: '/$teamId/' });
  const search = useSearch({ from: '/$teamId/' }) as { from?: string; redirect?: string };

  useEffect(() => {
    const isArtist = oem?.theme?.id === 'artist';
    const from = search?.from;
    // 仅当明确从 home 或 login 进入时跳转，不处理其它来源
    if (isArtist && (from === 'home' || from === 'login')) {
      navigate({ to: '/$teamId/nav/$navId', params: { teamId, navId: 'designs' } });
      return;
    }
    // 若显式带了 redirect，则尊重 redirect
    if (search?.redirect) {
      const to = decodeURIComponent(search.redirect);
      try {
        navigate({ to: to as any, params: { teamId } as any });
      } catch {}
    }
  }, [oem?.theme?.id, search?.from, teamId]);

  return <Workbench />;
};

export const Route = createLazyFileRoute('/$teamId/')({
  component: TeamEntry,
});
