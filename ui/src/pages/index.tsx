import React, { useEffect } from 'react';

import { createFileRoute, useNavigate } from '@tanstack/react-router';

import { CircularProgress } from '@/components/ui/circular-progress';
import { motion } from 'framer-motion';
import { DoorOpen, LogIn } from 'lucide-react';
import { useTranslation } from 'react-i18next';

import { useTeams } from '@/apis/authz/team';
import { IVinesTeam } from '@/apis/authz/team/typings.ts';
import { VinesDarkMode } from '@/components/layout/main/vines-darkmode.tsx';
import { authGuard } from '@/components/router/guard/auth.ts';
import { Button } from '@/components/ui/button';
import { I18nSelector } from '@/components/ui/i18n-selector';
import { clearAllLocalData, useLocalStorage } from '@/utils';

const TeamsIdPage: React.FC = () => {
  const { t } = useTranslation();

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

  return (
    <>
      <CircularProgress className="mb-4 [&_circle:last-child]:stroke-vines-500" aria-label="Loading..." />
      <h1 className="animate-pulse font-bold text-vines-500">{t('auth.loading')}</h1>
      <motion.div
        className="-mb-28 flex flex-col items-center"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1, transition: { delay: 3 } }}
      >
        <div className="flex items-center gap-4">
          <Button
            className="mb-2 mt-9"
            size="small"
            variant="outline"
            icon={<LogIn />}
            onClick={() => {
              clearAllLocalData();
              void navigate({ to: '/login' });
            }}
          >
            {t('auth.wait-to-long.re-login')}
          </Button>
          <Button
            className="mb-2 mt-9"
            size="small"
            variant="outline"
            icon={<DoorOpen />}
            onClick={() => navigate({ to: '/' })}
          >
            {t('auth.wait-to-long.force-enter')}
          </Button>
        </div>
        <span className="text-xs text-opacity-70">{t('auth.wait-to-long.title')}</span>
        <span className="text-xs text-opacity-70">{t('auth.wait-to-long.desc')}</span>
      </motion.div>
      <div className="absolute bottom-6 left-6 flex items-center gap-2">
        <VinesDarkMode />
        <I18nSelector />
      </div>
    </>
  );
};

export const Route = createFileRoute('/')({
  component: TeamsIdPage,
  beforeLoad: authGuard,
});
