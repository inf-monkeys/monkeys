import React from 'react';

import { createLazyFileRoute } from '@tanstack/react-router';

import { get } from 'lodash';

import { useSystemConfig } from '@/apis/common';
import { CustomizationLoginPage } from '@/apis/common/typings';
import { VinesUserLogin } from '@/components/layout/login';
import { ArtistLogin } from '@/components/layout/login/artist-login';
import { VinesDarkMode } from '@/components/layout/main/vines-darkmode.tsx';
import { I18nSelector } from '@/components/ui/i18n-selector';
import { AppLogo } from '@/components/ui/logo';
import { useAppStore } from '@/store/useAppStore';

const Login: React.FC = () => {
  const darkMode = useAppStore((s) => s.darkMode);
  const { data: oem, error } = useSystemConfig();

  const logoUrl = get(oem, `theme.logo.${darkMode ? 'dark' : 'light'}`, '');
  const appName = get(oem, 'theme.name', 'AI');

  const hideLogin = get(oem, 'auth.hideAuthToast', false);

  const isServerError = error instanceof Error;
  const isArtistTheme = oem?.theme.id === 'artist';
  const loginPageConfig = get(oem, 'theme.loginPage') as CustomizationLoginPage | undefined;
  const loginPageStyle = loginPageConfig?.style ?? (isArtistTheme ? 'modern' : 'classic');
  const themePrimaryColor = get(oem, 'theme.colors.primaryColor', '#4D8F9D');
  const useModernLogin = loginPageStyle === 'modern';

  return (
    <>
      {useModernLogin ? (
        <ArtistLogin
          loginPageConfig={{
            background: loginPageConfig?.background,
            logo: loginPageConfig?.logo,
            logoLocation: loginPageConfig?.logoLocation,
            formRadius: loginPageConfig?.formRadius,
            theme: loginPageConfig?.theme,
          }}
          primaryColor={themePrimaryColor}
          darkMode={darkMode}
        />
      ) : (
        <>
          <div className="flex flex-col items-center gap-8">
            {hideLogin ? (
              <div className="flex flex-col items-center gap-8">
                <img src="/Iframe404.webp" alt="遇到网络错误，请刷新整个页面重试" />
                <span>遇到网络错误，请刷新整个页面重试</span>
              </div>
            ) : (
              <>
                {!isServerError && <AppLogo url={logoUrl} alt={appName} height={36} />}
                <VinesUserLogin />
              </>
            )}
          </div>
          <div className="absolute bottom-6 left-6 flex items-center gap-2">
            <VinesDarkMode />
            <I18nSelector />
          </div>
        </>
      )}
    </>
  );
};

export const Route = createLazyFileRoute('/login/')({
  component: Login,
});
