import React, { useEffect } from 'react';

import { createFileRoute, useNavigate } from '@tanstack/react-router';

import { CircularProgress } from '@nextui-org/progress';
import { motion } from 'framer-motion';

import { useTeams } from '@/apis/authz/team';
import { IVinesTeam } from '@/apis/authz/team/typings.ts';
import { authGuard } from '@/components/router/guard/auth.ts';
import { Button } from '@/components/ui/button';
import { useLocalStorage } from '@/utils';

const TeamsIdPage: React.FC = () => {
  const navigate = useNavigate();

  const { data: teams } = useTeams();
  const [teamId] = useLocalStorage<string>('vines-team-id', '', false);
  const [, setLocalTeams] = useLocalStorage<IVinesTeam[]>('vines-teams', []);

  useEffect(() => {
    if (!teams) return;
    setLocalTeams(teams);
    void navigate({
      to: '/$teamId',
      params: {
        teamId: teamId ? teamId : teams[0].id,
      },
    });
  }, [teamId, teams]);

  const handleForceLogin = () => {
    void navigate({
      to: '/login',
    });
    localStorage.removeItem('vines-teams');
    localStorage.removeItem('vines-team-id');
    localStorage.removeItem('vines-token');
    localStorage.removeItem('vines-tokens');
    localStorage.removeItem('vines-account');
    localStorage.removeItem('vines-apikey');
  };

  return (
    <>
      <CircularProgress className="mb-4 [&_circle:last-child]:stroke-vines-500" aria-label="Loading..." />
      <h1 className="animate-pulse font-bold text-vines-500">正在载入中</h1>
      <motion.div
        className="-mb-28 flex flex-col items-center"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1, transition: { delay: 3 } }}
      >
        <Button className="mb-2 mt-9" onClick={handleForceLogin}>
          强制重新登录
        </Button>
        <span className="text-xs text-opacity-70">检测到在此页面等待时间过长</span>
        <span className="text-xs text-opacity-70">请尝试重新登录</span>
      </motion.div>
    </>
  );
};

export const Route = createFileRoute('/')({
  component: TeamsIdPage,
  beforeLoad: authGuard,
});
