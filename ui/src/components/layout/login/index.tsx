import React from 'react';

import { useCreation, useDebounceEffect } from 'ahooks';
import { AnimatePresence, motion } from 'framer-motion';
import { get, isEmpty } from 'lodash';
import { useTranslation } from 'react-i18next';

import { handleOidcLogin } from '@/apis/authz/oidc';
import { useSystemConfig } from '@/apis/common';
import { AuthMethod } from '@/apis/common/typings.ts';
import { getVinesToken } from '@/apis/utils.ts';
import { AuthContainer } from '@/components/layout/login/auth';
import { IAuthWrapperOptions } from '@/components/layout/login/auth/auth-wrapper.tsx';
import { getVinesTeamId } from '@/components/router/guard/team.tsx';
import { SmoothTransition } from '@/components/ui/smooth-transition-size/SmoothTransition.tsx';
import { cn } from '@/utils';
import VinesEvent from '@/utils/events.ts';

interface IVinesUserLoginProps extends IAuthWrapperOptions {
  otherAuthMethods?: boolean;
}

export const VinesUserLogin: React.FC<IVinesUserLoginProps> = ({
  otherAuthMethods = true,
  buttonContent,
  buttonIcon,
  onLoginFinished,
}) => {
  const { t } = useTranslation();

  const { data: oem, error } = useSystemConfig();

  const loginMethods: AuthMethod[] = get(oem, 'auth.enabled', [] as AuthMethod[]);
  const loginMethodsLength = loginMethods?.filter((it: string) => it !== 'apikey').length;

  const isPhoneEnable = loginMethods.includes(AuthMethod.phone);
  const isPasswordEnable = loginMethods.includes(AuthMethod.password);
  const isOidcEnabled = loginMethods.includes(AuthMethod.oidc);

  const oauthProviders = useCreation(
    () => loginMethods.map((it) => (it.startsWith('oauth-') ? it.replace('oauth-', '') : '')).filter(Boolean),
    [loginMethods],
  );
  const isOAuthEnabled = oauthProviders.length > 0;

  const oidcButtonText: string = get(oem, 'auth.oidc.buttonText', 'OIDC');
  const autoSignInOidc: boolean = get(oem, 'auth.oidc.autoSignin', false);

  useDebounceEffect(
    () => {
      if (autoSignInOidc && isOidcEnabled) {
        if (isEmpty(getVinesToken())) {
          handleOidcLogin();
        } else {
          const teamId = getVinesTeamId();
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
    <div className="relative flex w-full flex-col items-center">
      <AnimatePresence>
        {loginMethodsLength ? (
          <SmoothTransition initialHeight={264}>
            <AuthContainer
              enableOidc={isOidcEnabled}
              enablePassword={isPasswordEnable}
              enablePhone={isPhoneEnable}
              enableOAuth={isOAuthEnabled}
              oauthProviders={oauthProviders}
              oidcButtonText={oidcButtonText}
              enableOtherAuthMethods={otherAuthMethods}
              buttonContent={buttonContent}
              buttonIcon={buttonIcon}
              onLoginFinished={onLoginFinished}
            />
          </SmoothTransition>
        ) : (
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
        )}
      </AnimatePresence>
    </div>
  );
};
