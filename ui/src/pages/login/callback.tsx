import React, { useEffect } from 'react';

import { useSWRConfig } from 'swr';
import { createFileRoute, useNavigate } from '@tanstack/react-router';

import { CircularProgress } from '@nextui-org/progress';
import { motion } from 'framer-motion';
import { DoorOpen, LogIn } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';

import { useSystemConfig } from '@/apis/common';
import { VinesDarkMode } from '@/components/layout/main/vines-darkmode.tsx';
import { saveAuthToken } from '@/components/router/guard/auth.ts';
import { Button } from '@/components/ui/button';
import { I18nSelector } from '@/components/ui/i18n-selector';
import { loginCallbackPageSearchSchema } from '@/schema/common.ts';
import { clearAllLocalData } from '@/utils';

const LoginCallback: React.FC = () => {
  const { t } = useTranslation();

  const navigate = useNavigate({ from: Route.fullPath });
  const { mutate } = useSWRConfig();
  const { access_token } = Route.useSearch();

  const { data: oem } = useSystemConfig();

  useEffect(() => {
    if (!access_token) {
      toast.warning(t('auth.oidc.auth-failed'));
      void navigate({ to: '/login' });
      return;
    }

    saveAuthToken(access_token).then((user) => {
      if (!user) {
        toast.warning(t('auth.oidc.auth-failed'));
        localStorage.removeItem('vines-token');
        localStorage.removeItem('vines-team-id');
        void navigate({ to: '/login' });
        return;
      }

      void mutate('/api/teams');
      void navigate({ to: '/' });
      toast.success(t('auth.login.success'));
    });
  }, [access_token]);

  const oidcText = oem?.auth?.oidc?.buttonText;

  return (
    <>
      <CircularProgress className="mb-4 [&_circle:last-child]:stroke-vines-500" aria-label={t('common.load.loading')} />
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

export const Route = createFileRoute('/login/callback')({
  component: LoginCallback,
  validateSearch: loginCallbackPageSearchSchema.parse,
});
