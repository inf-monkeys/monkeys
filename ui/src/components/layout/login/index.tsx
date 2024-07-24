import React, { useEffect, useState } from 'react';

import { useNavigate } from '@tanstack/react-router';

import { AnimatePresence, motion } from 'framer-motion';
import { DoorOpen, ShieldCheck } from 'lucide-react';
import { useTranslation } from 'react-i18next';

import { handleOidcLogin } from '@/apis/authz/oidc';
import { EmailAuth } from '@/components/layout/login/email-auth.tsx';
import { PhoneAuth } from '@/components/layout/login/phone-auth.tsx';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator.tsx';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs.tsx';
import { useLocalStorage } from '@/hooks/use-local-storage';
import { cn } from '@/utils';

interface IAuthContainerProps extends React.ComponentPropsWithoutRef<'div'> {
  loginMethodsLength: number;

  enableOidc: boolean;
  enablePhone: boolean;
  enablePassword: boolean;

  oidcButtonText?: string;
}

export const AuthContainer: React.FC<IAuthContainerProps> = ({
  loginMethodsLength,
  enableOidc,
  enablePhone,
  enablePassword,
  oidcButtonText,
}) => {
  const { t } = useTranslation();

  const navigate = useNavigate();

  const [token] = useLocalStorage<string>('vines-token', '', false);

  const [activeTab, setActiveTab] = useState('phone');

  const onlyOne = loginMethodsLength === 1;
  useEffect(() => {
    setActiveTab(enablePhone ? 'phone' : 'email');
  }, []);

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
                  <PhoneAuth />
                </TabsContent>
              )}
              {enablePassword && activeTab === 'email' && (
                <TabsContent value="email" className="w-full" forceMount>
                  <EmailAuth />
                </TabsContent>
              )}
            </motion.div>
          </AnimatePresence>
        </Tabs>
      )}
      {token || enableOidc ? (
        <div className="-mt-2 flex w-full flex-col gap-6">
          <div className="flex items-center justify-center gap-4">
            <Separator className="flex-1" />
            <span className="text-xs text-opacity-70">{t('auth.login.other')}</span>
            <Separator className="flex-1" />
          </div>
          {token && (
            <>
              <Button variant="outline" icon={<DoorOpen />} onClick={() => navigate({ to: '/' })}>
                {t('auth.login.nav-to-home')}
              </Button>
              <span className="-mt-4 text-xs text-opacity-70">{t('auth.login.has-token-tips')}</span>
            </>
          )}
          {enableOidc && (
            <>
              <Button
                variant={onlyOne ? 'solid' : 'default'}
                icon={<ShieldCheck className="mt-0.5" />}
                onClick={handleOidcLogin}
              >
                {oidcButtonText ?? 'OIDC'}
              </Button>
              {!areValuesUsed && <span className="-mt-4 text-xs text-opacity-70">{t('auth.login.only-oidc')}</span>}
            </>
          )}
        </div>
      ) : null}
    </motion.main>
  );
};
