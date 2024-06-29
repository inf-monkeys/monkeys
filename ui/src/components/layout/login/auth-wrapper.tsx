import React, { useEffect, useState } from 'react';

import { useSWRConfig } from 'swr';
import { useNavigate } from '@tanstack/react-router';

import { Info } from 'lucide-react';
import { UseFormReturn } from 'react-hook-form';
import { toast } from 'sonner';

import { useLoginByPassword, useLoginByPhone } from '@/apis/authz';
import { AuthMethod } from '@/apis/common/typings.ts';
import { saveAuthToken } from '@/components/router/guard/auth.ts';
import { Button } from '@/components/ui/button';
import { Form } from '@/components/ui/form.tsx';
import { Route } from '@/pages/login';

interface IAuthWrapperProps extends React.ComponentPropsWithoutRef<'div'> {
  form: UseFormReturn<never>;
  onFinished?: () => void;
  method: AuthMethod;
}

export const AuthWrapper: React.FC<IAuthWrapperProps> = ({ form, onFinished, children, method }) => {
  const navigate = useNavigate({ from: Route.fullPath });
  const { redirect_url } = Route.useSearch();
  const { mutate } = useSWRConfig();

  const { trigger: triggerPassword, data: passwordData } = useLoginByPassword();
  const { trigger: triggerPhone, data: phoneData } = useLoginByPhone();

  const [isLoggingIn, setIsLoggingIn] = useState(false);

  const handleSubmit = form.handleSubmit((params) => {
    if (!Object.values(AuthMethod).includes(method)) {
      toast.error('不受支持的登录方式');
      return;
    }

    setIsLoggingIn(true);

    localStorage.removeItem('vines-team-id');

    toast.promise((method === AuthMethod.phone ? triggerPhone : triggerPassword)(params), {
      loading: '登录中...',
      finally: () => setIsLoggingIn(false),
    });
  });

  useEffect(() => {
    if (!passwordData && !phoneData) return;

    const finalToken = passwordData?.token ?? phoneData?.token ?? '';

    saveAuthToken(finalToken).then((result) => {
      if (result === 1) {
        void mutate('/api/teams');
        // TODO: 似乎无法正常跳转
        void navigate({ to: redirect_url ?? '/' });
      }
      onFinished?.();
      toast.success('登录成功');
    });
  }, [passwordData, phoneData]);

  return (
    <Form {...form}>
      <form onSubmit={handleSubmit} className="mt-4 flex flex-col gap-4">
        {children}

        <div className="my-1 flex justify-between text-xs">
          <span className="flex items-center gap-2 opacity-70">
            <Info size={14} />
            <span>未注册用户将自动注册</span>
          </span>
        </div>

        <Button type="submit" loading={isLoggingIn} variant="solid">
          登录
        </Button>
      </form>
    </Form>
  );
};
