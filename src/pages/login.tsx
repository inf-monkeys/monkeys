import React from 'react';

import { createFileRoute } from '@tanstack/react-router';

import { AnimatePresence, motion } from 'framer-motion';
import { get } from 'lodash';
import { AuthContainer } from 'src/components/layout/login/authz';

import { useOemConfig } from '@/apis/common';
import { AuthzUsers } from '@/components/layout/login/users';
import { AppLogo } from '@/components/ui/logo';
import { SmoothTransition } from '@/components/ui/smooth-transition-size/SmoothTransition.tsx';
import { pageSearchSchema } from '@/shema/common.ts';
import { useLocalStorage } from '@/utils';

const Login: React.FC = () => {
  const { data: oem } = useOemConfig();

  const [tokens] = useLocalStorage('vines-tokens', {});
  const [swap, setSwap] = useLocalStorage('vines-authz-swap', 'users');

  const logoUrl = get(oem, 'theme.logoUrl', '');
  const appName = get(oem, 'theme.name', '');

  const loginMethods = get(oem, 'identity.loginMethods', [] as string[]);
  const isPhoneEnable = loginMethods.includes('sms');
  const isEmailEnable = loginMethods.includes('password');

  const hasTokens = Object.keys(tokens).length > 0;

  return (
    <div className="flex flex-col items-center gap-8">
      <AppLogo url={logoUrl.includes('vines.svg') ? void 0 : logoUrl} alt={appName} height={36} />
      <div className="relative flex w-full flex-col items-center">
        <AnimatePresence>
          {!isEmailEnable && !isPhoneEnable ? (
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
            <SmoothTransition>
              <AuthzUsers tokens={tokens} setSwap={setSwap} />
            </SmoothTransition>
          ) : (
            <SmoothTransition>
              <AuthContainer
                enableEmail={isEmailEnable}
                enablePhone={isPhoneEnable}
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

export const Route = createFileRoute('/login')({
  component: Login,
  validateSearch: pageSearchSchema.parse,
});
