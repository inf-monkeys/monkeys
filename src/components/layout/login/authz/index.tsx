import React, { useEffect, useState } from 'react';

import { AnimatePresence, motion } from 'framer-motion';
import { ShieldCheck, Users } from 'lucide-react';

import { EmailAuth } from '@/components/layout/login/authz/email-auth.tsx';
import { PhoneAuth } from '@/components/layout/login/authz/phone-auth.tsx';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator.tsx';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs.tsx';

interface IAuthContainerProps extends React.ComponentPropsWithoutRef<'div'> {
  loginMethodsLength: number;

  enableOidc: boolean;
  enablePhone: boolean;
  enablePassword: boolean;

  oidcButtonText?: string;

  setSwap: (value: string) => void;
  hasTokens: boolean;
}

export const AuthContainer: React.FC<IAuthContainerProps> = ({
  loginMethodsLength,
  enableOidc,
  enablePhone,
  enablePassword,
  oidcButtonText,
  setSwap,
  hasTokens,
}) => {
  const [activeTab, setActiveTab] = useState('phone');

  const onlyOne = loginMethodsLength === 1;
  useEffect(() => {
    if (onlyOne) {
      // setActiveTab(enablePhone ? 'phone' : 'email');
    }
  }, [onlyOne]);

  const handleSwapUsers = () => setSwap('users');

  const handleOidcLogin = () => (window.location.href = `/api/auth/oidc/login?redirect_to=${window.location.href}`);

  const areValuesUsed = enablePassword || enablePhone;

  return (
    <motion.main
      className="flex flex-col items-center gap-8"
      key="vines-login"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1, transition: { duration: 0.2 } }}
      exit={{ opacity: 0 }}
    >
      {areValuesUsed && (
        <Tabs
          id="vines-login-tab"
          defaultValue="phone"
          className="flex w-72 flex-col items-center"
          value={activeTab}
          onValueChange={setActiveTab}
        >
          <TabsList className="grid w-full grid-cols-2">
            {enablePhone && <TabsTrigger value="phone">手机号登录</TabsTrigger>}
            {enablePassword && <TabsTrigger value="email">邮箱登录</TabsTrigger>}
          </TabsList>
          <AnimatePresence mode="wait">
            <motion.div
              key={activeTab}
              className="w-full"
              initial={{ x: 10, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              exit={{ x: -10, opacity: 0 }}
              transition={{ duration: 0.2 }}
            >
              {enablePhone && activeTab === 'phone' && (
                <TabsContent value="phone" className="w-full" forceMount>
                  <PhoneAuth onFinished={handleSwapUsers} />
                </TabsContent>
              )}
              {enablePassword && activeTab === 'email' && (
                <TabsContent value="email" className="w-full" forceMount>
                  <EmailAuth onFinished={handleSwapUsers} />
                </TabsContent>
              )}
            </motion.div>
          </AnimatePresence>
        </Tabs>
      )}
      {hasTokens || enableOidc ? (
        <div className="-mt-2 flex w-full flex-col gap-6">
          {!onlyOne &&
            (enableOidc ? (
              <div className="flex items-center justify-center gap-4">
                <Separator className="flex-1" />
                <span className="text-xs text-opacity-70">其他登录方式</span>
                <Separator className="flex-1" />
              </div>
            ) : (
              <Separator />
            ))}
          {enableOidc && (
            <>
              <Button
                variant={onlyOne ? 'solid' : 'default'}
                icon={<ShieldCheck className="mt-0.5" />}
                onClick={handleOidcLogin}
              >
                {oidcButtonText ?? 'OIDC'}
              </Button>
              {!areValuesUsed && <span className="-mt-2 text-xs text-opacity-70">仅支持使用 OIDC 进行身份验证</span>}
            </>
          )}
          {hasTokens && (
            <Button icon={<Users />} onClick={handleSwapUsers}>
              选择已登录的账号
            </Button>
          )}
        </div>
      ) : null}
    </motion.main>
  );
};
