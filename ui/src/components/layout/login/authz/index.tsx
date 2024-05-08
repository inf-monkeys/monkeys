import React, { useEffect, useState } from 'react';

import { AnimatePresence, motion } from 'framer-motion';
import { ShieldCheck, Users } from 'lucide-react';
import { useTranslation } from 'react-i18next';

import { handleOidcLogin } from '@/apis/authz/oidc';
import { EmailAuth } from '@/components/layout/login/authz/email-auth.tsx';
import { PhoneAuth } from '@/components/layout/login/authz/phone-auth.tsx';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator.tsx';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs.tsx';
import { cn } from '@/utils';

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
  const { t } = useTranslation();

  const [activeTab, setActiveTab] = useState('phone');

  const onlyOne = loginMethodsLength === 1;
  useEffect(() => {
    if (onlyOne) {
      setActiveTab(enablePhone ? 'phone' : 'email');
    }
  }, [onlyOne]);

  const handleSwapUsers = () => setSwap('users');

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
          <TabsList className={cn('grid w-full grid-cols-2', onlyOne && 'grid-cols-1')}>
            {enablePhone && <TabsTrigger value="phone">{t('auth.login.sms')}</TabsTrigger>}
            {enablePassword && <TabsTrigger value="email">{t('auth.login.email')}</TabsTrigger>}
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
                <span className="text-xs text-opacity-70">{t('auth.login.other')}</span>
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
              {!areValuesUsed && <span className="-mt-2 text-xs text-opacity-70">{t('auth.login.only-oidc')}</span>}
            </>
          )}
          {hasTokens && (
            <Button icon={<Users />} onClick={handleSwapUsers}>
              {t('auth.login.select-account')}
            </Button>
          )}
        </div>
      ) : null}
    </motion.main>
  );
};
