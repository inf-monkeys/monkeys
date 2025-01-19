import React, { useEffect, useState } from 'react';

import { useNavigate } from '@tanstack/react-router';

import { AnimatePresence, motion } from 'framer-motion';
import { DoorOpen, Group, ShieldCheck } from 'lucide-react';
import { useTranslation } from 'react-i18next';

import { handleOidcLogin } from '@/apis/authz/oidc';
import { IAuthWrapperOptions } from '@/components/layout/login/auth/auth-wrapper.tsx';
import { EmailAuth } from '@/components/layout/login/auth/email-auth.tsx';
import { PhoneAuth } from '@/components/layout/login/auth/phone-auth.tsx';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator.tsx';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs.tsx';
import { useLocalStorage } from '@/hooks/use-local-storage';
import { cn } from '@/utils';
import { OAuthProvider } from 'src/components/layout/login/auth/oauth/typing.tsx';

interface IAuthContainerProps extends React.ComponentPropsWithoutRef<'div'>, IAuthWrapperOptions {
  enableOidc: boolean;
  enablePhone: boolean;
  enablePassword: boolean;
  enableOAuth: boolean;

  oauthProviders?: string[];
  oidcButtonText?: string;

  enableOtherAuthMethods?: boolean;
}

export const AuthContainer: React.FC<IAuthContainerProps> = ({
  enableOidc,
  enablePhone,
  enablePassword,
  enableOAuth,
  oauthProviders = [],
  oidcButtonText,
  enableOtherAuthMethods = true,
  buttonContent,
  buttonIcon,
  onLoginFinished,
}) => {
  const { t } = useTranslation();

  const navigate = useNavigate();

  const [token] = useLocalStorage<string>('vines-token', '', false);

  const [activeTab, setActiveTab] = useState('phone');

  const onlyOne = [enablePhone, enablePassword].filter(Boolean).length === 1;
  useEffect(() => {
    setActiveTab(enablePhone ? 'phone' : 'email');
  }, []);

  const areValuesUsed = enablePassword || enablePhone;

  return (
    <motion.main
      className="flex flex-col items-center gap-8"
      key="vines-login"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
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
            >
              {enablePhone && activeTab === 'phone' && (
                <TabsContent value="phone" className="w-full" forceMount>
                  <PhoneAuth buttonContent={buttonContent} buttonIcon={buttonIcon} onLoginFinished={onLoginFinished} />
                </TabsContent>
              )}
              {enablePassword && activeTab === 'email' && (
                <TabsContent value="email" className="w-full" forceMount>
                  <EmailAuth buttonContent={buttonContent} buttonIcon={buttonIcon} onLoginFinished={onLoginFinished} />
                </TabsContent>
              )}
            </motion.div>
          </AnimatePresence>
        </Tabs>
      )}
      {(token || enableOidc || enableOAuth) && enableOtherAuthMethods ? (
        <div className="-mt-2 flex w-full flex-col gap-6">
          <div className="flex items-center justify-center gap-4">
            <Separator className="flex-1" />
            <span className="text-xs text-opacity-70">{t('auth.login.other')}</span>
            <Separator className="flex-1" />
          </div>
          {enableOAuth && (
            <div className="-my-2 flex w-full items-center justify-center gap-4">
              {oauthProviders.map((providerName, i) => {
                const OAProvider = OAuthProvider[providerName];
                return (
                  <OAProvider.Provider key={i}>
                    <Button icon={OAProvider?.icon ? <OAProvider.icon /> : <Group />} variant="outline">
                      {t([OAProvider.name, providerName])}
                    </Button>
                  </OAProvider.Provider>
                );
              })}
            </div>
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
          {token && (
            <>
              <Button variant="outline" icon={<DoorOpen />} onClick={() => void navigate({ to: '/' })}>
                {t('auth.login.nav-to-home')}
              </Button>
              <span className="-mt-4 text-xs text-opacity-70">{t('auth.login.has-token-tips')}</span>
            </>
          )}
        </div>
      ) : null}
    </motion.main>
  );
};
