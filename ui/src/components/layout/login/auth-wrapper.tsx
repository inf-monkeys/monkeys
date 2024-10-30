import React, { useEffect, useRef, useState } from 'react';

import { useSWRConfig } from 'swr';
import { useNavigate } from '@tanstack/react-router';

import type { EventEmitter } from 'ahooks/lib/useEventEmitter';
import { Info } from 'lucide-react';
import { UseFormReturn } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';

import { useLoginByPassword, useLoginByPhone } from '@/apis/authz';
import { AuthMethod } from '@/apis/common/typings.ts';
import { saveAuthToken } from '@/components/router/guard/auth.ts';
import { Button } from '@/components/ui/button';
import { Form } from '@/components/ui/form.tsx';
import { VinesFullLoading } from '@/components/ui/loading';
import { setLocalStorage } from '@/hooks/use-local-storage';
import { Route } from '@/pages/login/index.lazy.tsx';
import VinesEvent from '@/utils/events.ts';

export type AuthEvent = 'trigger-login' | 'clear-sms-code-input';

interface IAuthWrapperProps {
  children?: React.ReactNode;

  form: UseFormReturn<never>;
  onFinished?: () => void;
  method: AuthMethod;

  event$?: EventEmitter<AuthEvent>;
}

export const AuthWrapper: React.FC<IAuthWrapperProps> = ({ form, onFinished, children, method, event$ }) => {
  const { t } = useTranslation();

  const navigate = useNavigate();
  const { redirect_id, redirect_params, redirect_search } = Route.useSearch<any>();
  const { mutate } = useSWRConfig();

  const { trigger: triggerPassword, data: passwordData } = useLoginByPassword();
  const { trigger: triggerPhone, data: phoneData } = useLoginByPhone();

  const [isLoggingIn, setIsLoggingIn] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = form.handleSubmit((params) => {
    if (!Object.values(AuthMethod).includes(method)) {
      toast.error(t('auth.login.unsupported-login-method'));
      return;
    }

    setIsLoggingIn(true);

    localStorage.removeItem('vines-team-id');
    window['vinesTeamId'] = void 0;

    toast.promise(
      (method === AuthMethod.phone ? triggerPhone : (triggerPassword as any))(params).catch(() => {
        if (method === AuthMethod.phone) {
          event$?.emit('clear-sms-code-input');
        }
      }),
      {
        loading: t('auth.login.loading'),
        finally: () => setIsLoggingIn(false),
      },
    );
  });

  useEffect(() => {
    if (!passwordData && !phoneData) return;

    const finalToken = passwordData?.token ?? phoneData?.token ?? '';

    saveAuthToken(finalToken).then((result) => {
      if (result) {
        setLoading(true);
        mutate('/api/teams').then((it) => {
          setLoading(false);
          setLocalStorage('vines-teams', it);
          if (
            redirect_id &&
            redirect_params &&
            !!redirect_params?.teamId &&
            it?.some((item: { id: string }) => item.id === redirect_params?.teamId)
          ) {
            VinesEvent.emit('vines-nav', redirect_id, redirect_params, redirect_search);
          } else {
            const currentTeamId = it?.[0]?.id;
            if (currentTeamId) {
              localStorage.setItem('vines-team-id', currentTeamId);
              window['vinesTeamId'] = currentTeamId;
            }
            void navigate({ to: '/' });
          }
        });
      }
      onFinished?.();
      toast.success(t('auth.login.success'));
    });
  }, [passwordData, phoneData]);

  const submitButtonRef = useRef<HTMLButtonElement>(null);
  event$?.useSubscription((mode) => {
    if (mode === 'trigger-login') {
      submitButtonRef.current?.click();
    }
  });

  return (
    <Form {...form}>
      <form onSubmit={handleSubmit} className="mt-4 flex flex-col gap-4">
        {children}

        <div className="my-1 flex justify-between text-xs">
          <span className="flex items-center gap-2 opacity-70">
            <Info size={14} />
            <span>{t('auth.login.login-desc')}</span>
          </span>
        </div>

        <Button ref={submitButtonRef} type="submit" loading={isLoggingIn} variant="solid">
          {t('auth.login.login')}
        </Button>
      </form>
      {loading && <VinesFullLoading className="top-0 z-50 backdrop-blur-sm" tips={t('auth.login.fetch-teams')} />}
    </Form>
  );
};
