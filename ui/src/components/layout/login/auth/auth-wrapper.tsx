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
import useUrlState from '@/hooks/use-url-state.ts';
import VinesEvent from '@/utils/events.ts';
import { IVinesTeam } from '@/apis/authz/team/typings.ts';
import { useGetDefaultLoginTeam } from '@/hooks/use-get-default-login-team.ts';

export type AuthEvent = 'trigger-login' | 'clear-sms-code-input';

export interface IAuthWrapperOptions {
  buttonContent?: React.ReactNode;
  buttonIcon?: React.ReactNode;
  onFinished?: () => void;
  onLoginFinished?: () => void;
}

interface IAuthWrapperProps extends IAuthWrapperOptions {
  children?: React.ReactNode;

  form: UseFormReturn<never>;
  method: AuthMethod;

  event$?: EventEmitter<AuthEvent>;
}

export const AuthWrapper: React.FC<IAuthWrapperProps> = ({
  form,
  onFinished,
  children,
  method,
  event$,
  buttonContent,
  buttonIcon,
  onLoginFinished,
}) => {
  const { t } = useTranslation();

  const navigate = useNavigate();
  const [{ redirect_id, redirect_params, redirect_search }] = useUrlState<{
    redirect_id?: number;
    redirect_params?: string;
    redirect_search?: string;
  }>({});
  const { mutate } = useSWRConfig();

  const getDefaultTeam = useGetDefaultLoginTeam();

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
      toast.success(t('auth.login.success'));
      if (result) {
        if (onLoginFinished) {
          onLoginFinished();
        } else {
          setLoading(true);
          mutate('/api/teams').then((it: IVinesTeam[] | undefined) => {
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
              const currentTeamId = getDefaultTeam(it);
              if (currentTeamId) {
                localStorage.setItem('vines-team-id', currentTeamId);
                window['vinesTeamId'] = currentTeamId;
              }
              void navigate({ to: '/' });
            }
          });
        }
      }
      onFinished?.();
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

        <Button ref={submitButtonRef} type="submit" loading={isLoggingIn} variant="solid" icon={buttonIcon}>
          {buttonContent ? buttonContent : t('auth.login.login')}
        </Button>
      </form>
      {loading && <VinesFullLoading className="top-0 z-50 backdrop-blur-sm" tips={t('auth.login.fetch-teams')} />}
    </Form>
  );
};
