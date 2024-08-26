import React, { useEffect } from 'react';

import { createFileRoute, useNavigate } from '@tanstack/react-router';

import { motion } from 'framer-motion';
import { DoorOpen, LogIn } from 'lucide-react';
import { useTranslation } from 'react-i18next';

import { VinesDarkMode } from '@/components/layout/main/vines-darkmode.tsx';
import { isAuthed } from '@/components/router/guard/auth';
import { useVinesTeam } from '@/components/router/guard/team.tsx';
import { Button } from '@/components/ui/button';
import { I18nSelector } from '@/components/ui/i18n-selector';
import { VinesLoading } from '@/components/ui/loading';
import { clearAllLocalData } from '@/hooks/use-local-storage';
import VinesEvent from '@/utils/events.ts';

const TeamsIdPage: React.FC = () => {
  const { t } = useTranslation();

  const navigate = useNavigate();

  const { teamId, teams } = useVinesTeam();

  useEffect(() => {
    if (!teams?.length) return;
    void navigate({
      to: '/$teamId/',
      params: {
        teamId: teamId ? teamId : teams[0].id,
      },
    });
  }, [teamId, teams]);

  if (!isAuthed()) {
    VinesEvent.emit('vines-nav', '/login');
  }

  return (
    <>
      <VinesLoading />
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
              VinesEvent.emit('vines-nav', '/login');
            }}
          >
            {t('auth.wait-to-long.force-re-login')}
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
});
