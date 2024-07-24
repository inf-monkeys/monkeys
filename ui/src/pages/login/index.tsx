import React, { useEffect } from 'react';

import { createFileRoute } from '@tanstack/react-router';

import { useDebounceEffect } from 'ahooks';
import { AnimatePresence, motion } from 'framer-motion';
import { get, isEmpty } from 'lodash';
import { useTranslation } from 'react-i18next';

import { handleOidcLogin } from '@/apis/authz/oidc';
import { useSystemConfig } from '@/apis/common';
import { AuthMethod } from '@/apis/common/typings.ts';
import { getVinesToken } from '@/apis/utils.ts';
import { AuthContainer } from '@/components/layout/login';
import { VinesDarkMode } from '@/components/layout/main/vines-darkmode.tsx';
import { I18nSelector } from '@/components/ui/i18n-selector';
import { AppLogo } from '@/components/ui/logo';
import { SmoothTransition } from '@/components/ui/smooth-transition-size/SmoothTransition.tsx';
import { pageSearchSchema } from '@/schema/common.ts';
import { useAppStore } from '@/store/useAppStore';
import { cn } from '@/utils';
import VinesEvent from '@/utils/events.ts';

const Login: React.FC = () => {
  const { t } = useTranslation();

  const { darkMode } = useAppStore();
  const { data: oem, error } = useSystemConfig();

  const logoUrl = get(oem, `theme.logo.${darkMode ? 'dark' : 'light'}`, '');
  const appName = get(oem, 'theme.name', 'AI');

  const loginMethods: AuthMethod[] = get(oem, 'auth.enabled', [] as AuthMethod[]);
  const loginMethodsLength = loginMethods?.filter((it: string) => it !== 'apikey').length;

  const isPhoneEnable = loginMethods.includes(AuthMethod.phone);
  const isPasswordEnable = loginMethods.includes(AuthMethod.password);
  const isOidcEnabled = loginMethods.includes(AuthMethod.oidc);

  const oidcButtonText: string = get(oem, 'auth.oidc.buttonText', 'OIDC');
  const autoSignInOidc: boolean = get(oem, 'auth.oidc.autoSignin', false);

  useDebounceEffect(
    () => {
      if (autoSignInOidc && isOidcEnabled) {
        if (isEmpty(getVinesToken())) {
          handleOidcLogin();
        } else {
          const teamId = localStorage.getItem('vines-team-id');
          if (isEmpty(teamId)) {
            VinesEvent.emit('vines-nav', '/');
          } else {
            VinesEvent.emit('vines-nav', '/$teamId', { teamId });
          }
        }
      }
    },
    [autoSignInOidc, isOidcEnabled],
    {
      wait: 80,
    },
  );

  const isServerError = error instanceof Error;

  return (
    <>
      <div className="flex flex-col items-center gap-8">
        {!isServerError && <AppLogo url={logoUrl} alt={appName} height={36} />}
        <div className="relative flex w-full flex-col items-center">
          <AnimatePresence>
            {!loginMethodsLength ? (
              <motion.div
                className="flex select-none items-center justify-center"
                key="vines-login-disabled"
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 28, transition: { delay: 0.5 } }}
                exit={{ opacity: 0, height: 0 }}
              >
                <h1 className={cn('text-lg font-bold text-vines-500', isServerError && 'animate-pulse')}>
                  {isServerError ? t('system.network-error') : t('system.empty-auth-methods')}
                </h1>
              </motion.div>
            ) : (
              <SmoothTransition initialHeight={264}>
                <AuthContainer
                  loginMethodsLength={loginMethodsLength}
                  enableOidc={isOidcEnabled}
                  enablePassword={isPasswordEnable}
                  enablePhone={isPhoneEnable}
                  oidcButtonText={oidcButtonText}
                />
              </SmoothTransition>
            )}
          </AnimatePresence>
        </div>
      </div>
      <div className="absolute bottom-6 left-6 flex items-center gap-2">
        <VinesDarkMode />
        <I18nSelector />
      </div>
    </>
  );
};

export const Route = createFileRoute('/login/')({
  component: Login,
  validateSearch: pageSearchSchema.parse,
});
