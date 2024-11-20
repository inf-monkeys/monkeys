import React, { useEffect } from 'react';

import { useSWRConfig } from 'swr';
import { createLazyFileRoute, useNavigate } from '@tanstack/react-router';

import { motion } from 'framer-motion';
import { DoorOpen, LogIn } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';

import { useSystemConfig } from '@/apis/common';
import { VinesDarkMode } from '@/components/layout/main/vines-darkmode.tsx';
import { saveAuthToken } from '@/components/router/guard/auth.ts';
import { Button } from '@/components/ui/button';
import { I18nSelector } from '@/components/ui/i18n-selector';
import { VinesLoading } from '@/components/ui/loading';
import { clearAllLocalData } from '@/hooks/use-local-storage';
import VinesEvent from '@/utils/events.ts';

const LoginCallback: React.FC = () => {
  const { t } = useTranslation();

  const navigate = useNavigate();
  const { mutate } = useSWRConfig();
  const { access_token, error } = Route.useSearch() as { access_token: string; error?: string };

  const { data: oem } = useSystemConfig();

  useEffect(() => {
    if (error) {
      toast.warning(error);
      VinesEvent.emit('vines-nav', '/login');
      return;
    }

    if (!access_token) {
      toast.warning(t('auth.oidc.auth-failed'));
      VinesEvent.emit('vines-nav', '/login');
      return;
    }

    saveAuthToken(access_token).then((user) => {
      if (!user) {
        toast.warning(t('auth.oidc.auth-failed'));
        localStorage.removeItem('vines-token');
        localStorage.removeItem('vines-team-id');
        window['vinesTeamId'] = void 0;
        VinesEvent.emit('vines-nav', '/login');
        return;
      }

      void mutate('/api/teams');
      void navigate({ to: '/' });
      toast.success(t('auth.login.success'));
    });
  }, [access_token, error]);

  const oidcText = oem?.auth?.oidc?.buttonText;

  return (
    <>
      <VinesLoading />
      <h1 className="animate-pulse font-bold text-vines-500">
        {t(`auth.${oidcText ? 'oidc' : 'login'}.logging-in`, { oidc: oidcText })}
      </h1>
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

export const Route = createLazyFileRoute('/login/callback')({
  component: LoginCallback,
});
