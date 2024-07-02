import React, { useEffect } from 'react';

import { useSWRConfig } from 'swr';
import { createFileRoute, useNavigate } from '@tanstack/react-router';

import { CircularProgress } from '@nextui-org/progress';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';

import { useSystemConfig } from '@/apis/common';
import { saveAuthToken } from '@/components/router/guard/auth.ts';
import { loginCallbackPageSearchSchema } from '@/schema/common.ts';
import { useLocalStorage } from '@/utils';

const LoginCallback: React.FC = () => {
  const { t } = useTranslation();

  const navigate = useNavigate({ from: Route.fullPath });
  const { mutate } = useSWRConfig();
  const { access_token } = Route.useSearch();

  const { data: oem } = useSystemConfig();

  const [, setSwap] = useLocalStorage('vines-authz-swap', 'users', false);

  useEffect(() => {
    if (!access_token) return;
    saveAuthToken(access_token).then((usersCount) => {
      if (!usersCount) {
        toast.warning(t('auth.oidc.auth-failed'));
        localStorage.removeItem('vines-token');
        localStorage.removeItem('vines-team-id');
        setSwap('login');
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
    </>
  );
};

export const Route = createFileRoute('/login/callback')({
  component: LoginCallback,
  validateSearch: loginCallbackPageSearchSchema.parse,
});
