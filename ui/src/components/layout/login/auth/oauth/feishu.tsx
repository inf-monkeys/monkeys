import React from 'react';

import { useMemoizedFn } from 'ahooks';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';

import { getFeishuOAuthInfo } from '@/apis/authz/oauth';

interface IOAuthFeishuProps extends React.ComponentPropsWithoutRef<'div'> { }

export const OAuthFeishuProvider: React.FC<IOAuthFeishuProps> = ({ children }) => {
  const { t, i18n } = useTranslation();
  const handleLogin = useMemoizedFn(() => {
    getFeishuOAuthInfo().then((it) => {
      if (it?.appId && it?.redirectUri && it?.feishuApiUrl) {
        const oauthUrl = `${it.feishuApiUrl}/open-apis/authen/v1/index?app_id=${it.appId}&redirect_uri=${it.redirectUri}&state=${encodeURIComponent(`redirect_to=${window.location.origin}/login/callback`)}`;
        window.location.href = oauthUrl;
      } else {
        toast.error(t('auth.oauth.feishu.get-info-failed'));
      }
    });
  });
  return <div onClick={handleLogin}>{children}</div>
};
