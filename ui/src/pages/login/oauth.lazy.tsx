import React, { useEffect } from 'react';

import { useSWRConfig } from 'swr';
import { createLazyFileRoute, useNavigate } from '@tanstack/react-router';

import { useMemoizedFn } from 'ahooks';
import { get } from 'lodash';
import { Group } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';
import { OAuthProvider } from 'src/components/layout/login/auth/oauth/typing.tsx';

import { useBindWeWorkProviderIdToUser } from '@/apis/authz/oauth';
import { useSystemConfig } from '@/apis/common';
import { VinesUserLogin } from '@/components/layout/login';
import { VinesDarkMode } from '@/components/layout/main/vines-darkmode.tsx';
import { I18nSelector } from '@/components/ui/i18n-selector';
import { AppLogo } from '@/components/ui/logo';
import { setLocalStorage } from '@/hooks/use-local-storage';
import useUrlState from '@/hooks/use-url-state.ts';
import { useAppStore } from '@/store/useAppStore';
import VinesEvent from '@/utils/events.ts';

const OAuthPage: React.FC = () => {
  const { t } = useTranslation();

  const { mutate } = useSWRConfig();

  const darkMode = useAppStore((s) => s.darkMode);
  const { data: oem, error } = useSystemConfig();

  const logoUrl = get(oem, `theme.logo.${darkMode ? 'dark' : 'light'}`, '');
  const appName = get(oem, 'theme.name', 'AI');

  const isServerError = error instanceof Error;

  const [{ provider, bind_code }] = useUrlState<{ provider?: number; bind_code?: string }>({});
  const Provider = OAuthProvider[provider];
  useEffect(() => {
    if (!Provider) {
      VinesEvent.emit('vines-nav', '/login', void 0, void 0, false);
    }
  }, [Provider]);

  const navigate = useNavigate();

  const { trigger } = useBindWeWorkProviderIdToUser();
  const handleBind = useMemoizedFn(async () => {
    toast.promise(trigger({ code: bind_code }), {
      loading: t('auth.oauth.loading'),
      success: () => {
        mutate('/api/teams').then((it) => {
          setLocalStorage('vines-teams', it);
          const currentTeamId = it?.[0]?.id;
          if (currentTeamId) {
            localStorage.setItem('vines-team-id', currentTeamId);
            window['vinesTeamId'] = currentTeamId;
          }
          void navigate({ to: '/' });
        });
        return t('auth.oauth.success');
      },
      error: t('auth.oauth.error'),
    });
  });

  return (
    <>
      <div className="flex flex-col items-center gap-8">
        {!isServerError && <AppLogo url={logoUrl} alt={appName} height={36} />}

        <VinesUserLogin
          otherAuthMethods={false}
          buttonIcon={Provider?.icon ? <Provider.icon className="stroke-white [&>path]:fill-white" /> : <Group />}
          buttonContent={t('auth.oauth.button', { name: t(Provider?.name) })}
          onLoginFinished={handleBind}
        />
      </div>
      <div className="absolute bottom-6 left-6 flex items-center gap-2">
        <VinesDarkMode />
        <I18nSelector />
      </div>
    </>
  );
};

export const Route = createLazyFileRoute('/login/oauth')({
  component: OAuthPage,
});
