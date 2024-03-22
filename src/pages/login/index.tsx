import React from 'react';

import { createFileRoute } from '@tanstack/react-router';

import { AnimatePresence, motion } from 'framer-motion';
import { get } from 'lodash';

import { useSystemConfig } from '@/apis/common';
import { AuthMethod } from '@/apis/common/typings.ts';
import { AuthContainer } from '@/components/layout/login/authz';
import { AuthzUsers } from '@/components/layout/login/users';
import { IUserTokens } from '@/components/router/guard/auth.ts';
import { AppLogo } from '@/components/ui/logo';
import { SmoothTransition } from '@/components/ui/smooth-transition-size/SmoothTransition.tsx';
import { pageSearchSchema } from '@/schema/common.ts';
import { useLocalStorage } from '@/utils';

const Login: React.FC = () => {
  const { data: oem } = useSystemConfig();

  const [tokens] = useLocalStorage<IUserTokens>('vines-tokens', {});
  const [swap, setSwap] = useLocalStorage('vines-authz-swap', 'users', false);

  const logoUrl = get(oem, 'theme.logoUrl', '');
  const appName = get(oem, 'theme.name', '');

  const loginMethods: AuthMethod[] = get(oem, 'auth.enabled', [] as AuthMethod[]);
  const loginMethodsLength = loginMethods.length;

  const isPhoneEnable = loginMethods.includes(AuthMethod.phone);
  const isPasswordEnable = loginMethods.includes(AuthMethod.password);
  const isOidcEnabled = loginMethods.includes(AuthMethod.oidc);

  const oidcButtonText: string = get(oem, 'auth.oidc.buttonText', 'OIDC');

  const hasTokens = Object.keys(tokens).length > 0;

  return (
    <div className="flex flex-col items-center gap-8">
      <AppLogo url={logoUrl.includes('vines.svg') ? void 0 : logoUrl} alt={appName} height={36} />
      <div className="relative flex w-full flex-col items-center">
        <AnimatePresence>
          {!loginMethodsLength ? (
            <motion.div
              className="flex select-none items-center justify-center"
              key="vines-login-disabled"
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 28 }}
              exit={{ opacity: 0, height: 0 }}
            >
              <h1 className="animate-pulse text-lg font-bold text-vines-500">系统维护中</h1>
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
