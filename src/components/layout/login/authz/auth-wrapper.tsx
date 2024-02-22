import React, { useEffect, useState } from 'react';

import { IconInfoCircle } from '@douyinfe/semi-icons';
import { useLocalStorage } from '@mantine/hooks';
import { UseFormReturn } from 'react-hook-form';
import { toast } from 'sonner';

import { useLogin } from '@/apis/authz';
import { saveAuthToken } from '@/components/router/auth-guard.ts';
import { Button } from '@/components/ui/button';
import { Form } from '@/components/ui/form.tsx';

interface IAuthWrapperProps extends React.ComponentPropsWithoutRef<'div'> {
  form: UseFormReturn<never>;
}

export const AuthWrapper: React.FC<IAuthWrapperProps> = ({ form, children }) => {
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
    data && saveAuthToken(data);
  }, [data]);

  return (
    <Form {...form}>
      <form onSubmit={handleSubmit} className="mt-2 flex flex-col gap-4">
        {children}

        <div className="my-1 flex justify-between text-xs">
          <span className="flex items-center gap-1 opacity-70">
            <IconInfoCircle size="small" />
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
