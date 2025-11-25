import React from 'react';

import { useMemoizedFn } from 'ahooks';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';

import { getDingtalkOAuthInfo } from '@/apis/authz/oauth';

interface IOAuthDingtalkProps extends React.ComponentPropsWithoutRef<'div'> {}

export const OAuthDingtalkProvider: React.FC<IOAuthDingtalkProps> = ({ children }) => {
  const { t } = useTranslation();
  const handleLogin = useMemoizedFn(() => {
    getDingtalkOAuthInfo().then((it) => {
      if (it?.appId && it?.redirectUri) {
        const loginBase = it.loginBaseUrl || 'https://login.dingtalk.com';
        const redirectState = encodeURIComponent(`redirect_to=${window.location.origin}/login/callback`);
        const redirectUri = encodeURIComponent(it.redirectUri);
        const scope = encodeURIComponent('openid contact:user:read');
        const oauthUrl = `${loginBase}/oauth2/auth?client_id=${it.appId}&redirect_uri=${redirectUri}&response_type=code&scope=${scope}&state=${redirectState}`;
        window.location.href = oauthUrl;
      } else {
        toast.error(t('auth.oauth.dingtalk.get-info-failed'));
      }
    });
  });
  return <div onClick={handleLogin}>{children}</div>;
};
