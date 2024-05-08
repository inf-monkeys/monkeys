import React from 'react';

import { createFileRoute } from '@tanstack/react-router';

import { AnimatePresence, motion } from 'framer-motion';
import { get } from 'lodash';

import { handleOidcLogin } from '@/apis/authz/oidc';
import { useSystemConfig } from '@/apis/common';
import { AuthMethod } from '@/apis/common/typings.ts';
import { AuthContainer } from '@/components/layout/login/authz';
import { AuthzUsers } from '@/components/layout/login/users';
import { IUserTokens } from '@/components/router/guard/auth.ts';
import { AppLogo } from '@/components/ui/logo';
import { SmoothTransition } from '@/components/ui/smooth-transition-size/SmoothTransition.tsx';
import { pageSearchSchema } from '@/schema/common.ts';
import { useAppStore } from '@/store/useAppStore';
import { cn, useLocalStorage } from '@/utils';

const Login: React.FC = () => {
  const { darkMode } = useAppStore();
  const { data: oem, error } = useSystemConfig();

  const [tokens] = useLocalStorage<IUserTokens>('vines-tokens', {});
  const [swap, setSwap] = useLocalStorage('vines-authz-swap', 'users', false);

  const logoUrl = get(oem, `theme.logo.${darkMode ? 'dark' : 'light'}`, '');
  const appName = get(oem, 'theme.name', '');

  const loginMethods: AuthMethod[] = get(oem, 'auth.enabled', [] as AuthMethod[]);
  const loginMethodsLength = loginMethods?.filter((it: string) => it !== 'apikey').length;

  const isPhoneEnable = loginMethods.includes(AuthMethod.phone);
  const isPasswordEnable = loginMethods.includes(AuthMethod.password);
  const isOidcEnabled = loginMethods.includes(AuthMethod.oidc);

  const oidcButtonText: string = get(oem, 'auth.oidc.buttonText', 'OIDC');
  const autoSigninOidc: boolean = get(oem, 'auth.oidc.autoSignin', false);

  if (autoSigninOidc && isOidcEnabled) {
    handleOidcLogin();
    return <></>;
  }

  const hasTokens = Object.keys(tokens).length > 0;

  const isServerError = error instanceof Error;

  return (
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
                {isServerError ? '系统维护中' : '系统已禁止登录'}
              </h1>
            </motion.div>
          ) : swap !== 'login' && hasTokens ? (
            <SmoothTransition initialHeight={201}>
              <AuthzUsers tokens={tokens} setSwap={setSwap} />
            </SmoothTransition>
          ) : (
            <SmoothTransition initialHeight={264}>
              <AuthContainer
                loginMethodsLength={loginMethodsLength}
                enableOidc={isOidcEnabled}
                enablePassword={isPasswordEnable}
                enablePhone={isPhoneEnable}
                oidcButtonText={oidcButtonText}
                setSwap={setSwap}
                hasTokens={hasTokens}
              />
            </SmoothTransition>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};

export const Route = createFileRoute('/login/')({
  component: Login,
  validateSearch: pageSearchSchema.parse,
});
