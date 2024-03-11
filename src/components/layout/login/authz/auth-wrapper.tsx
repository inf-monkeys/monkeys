import React, { useEffect, useState } from 'react';

import { useSWRConfig } from 'swr';
import { useNavigate } from '@tanstack/react-router';

import { Info } from 'lucide-react';
import { UseFormReturn } from 'react-hook-form';
import { toast } from 'sonner';

import { useLogin } from '@/apis/authz';
import { saveAuthToken } from '@/components/router/guard/auth.ts';
import { Button } from '@/components/ui/button';
import { Form } from '@/components/ui/form.tsx';
import { Route } from '@/pages/login.tsx';

interface IAuthWrapperProps extends React.ComponentPropsWithoutRef<'div'> {
  form: UseFormReturn<never>;
  onFinished?: () => void;
}

export const AuthWrapper: React.FC<IAuthWrapperProps> = ({ form, onFinished, children }) => {
  const navigate = useNavigate({ from: Route.fullPath });
  const { redirect_url } = Route.useSearch();
  const { mutate } = useSWRConfig();
  const { trigger, data } = useLogin();

  const [isLoggingIn, setIsLoggingIn] = useState(false);

  const handleSubmit = form.handleSubmit((params) => {
    setIsLoggingIn(true);
    toast.promise(trigger(params), {
      loading: '登录中...',
      error: '登录失败，请检查网络是否通畅',
      finally: () => setIsLoggingIn(false),
    });
  });

  useEffect(() => {
    if (!data) return;
    if (saveAuthToken(data) === 1) {
      void mutate('/api/teams');
      // TODO: 似乎无法正常跳转
      void navigate({ to: redirect_url ?? '/' });
    }
    onFinished?.();
    toast.success('登录成功');
  }, [data]);

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
