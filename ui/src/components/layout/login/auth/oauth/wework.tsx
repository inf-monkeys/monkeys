import React, { useState } from 'react';

import * as ww from '@wecom/jssdk';
import { WWLoginLangType, WWLoginRedirectType, WWLoginType } from '@wecom/jssdk';
import { useMemoizedFn } from 'ahooks';
import { AnimatePresence } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';

import { getWeWorkOAuthInfo } from '@/apis/authz/oauth';
import { Dialog, DialogContent, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { VinesLoading } from '@/components/ui/loading';

interface IOAuthWeWorkProviderProps extends React.ComponentPropsWithoutRef<'div'> {}

export const OAuthWeWorkProvider: React.FC<IOAuthWeWorkProviderProps> = ({ children }) => {
  const { t, i18n } = useTranslation();

  const [isLoading, setIsLoading] = useState(true);
  const ref = useMemoizedFn((node: HTMLDivElement) => {
    if (node) {
      getWeWorkOAuthInfo().then((it) => {
        if (it?.corpId && it?.agentid && it?.redirect_uri) {
          const { el: weworkIframe } = ww.createWWLoginPanel({
            el: node,
            params: {
              login_type: WWLoginType.corpApp,
              appid: it.corpId,
              agentid: it.agentid,
              redirect_uri: it.redirect_uri,
              redirect_type: WWLoginRedirectType.top,
              lang: i18n.language === 'zh' ? WWLoginLangType.zh : WWLoginLangType.en,
            },
            onLoginFail({ errMsg }) {
              toast.error(errMsg);
            },
          });
          weworkIframe.onload = () => {
            setIsLoading(false);
          };
        } else {
          toast.error(t('auth.oauth.wework.get-info-failed'));
        }
      });
    }
  });

  return (
    <Dialog onOpenChange={(val) => !val && setIsLoading(true)}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="max-w-[528px]">
        <DialogTitle>{t('auth.oauth.wework.label')}</DialogTitle>
        <div ref={ref} className="relative overflow-hidden rounded-md">
          <AnimatePresence>
            {isLoading && (
              <VinesLoading
                key="vines-oauth-wework-loading"
                className="vines-center absolute top-0 z-10 size-full bg-background"
                immediately
              />
            )}
          </AnimatePresence>
        </div>
      </DialogContent>
    </Dialog>
  );
};
