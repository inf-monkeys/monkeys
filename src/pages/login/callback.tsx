import React, { useEffect } from 'react';

import { useSWRConfig } from 'swr';
import { createFileRoute } from '@tanstack/react-router';

import { toast } from 'sonner';

import { saveAuthToken } from '@/components/router/guard/auth.ts';
import { loginCallbackPageSearchSchema } from '@/schema/common.ts';

const LoginCallback: React.FC = () => {
  const { mutate } = useSWRConfig();
  const { access_token } = Route.useSearch();

  useEffect(() => {
    if (!access_token) return;
    if (saveAuthToken(access_token) === 1) {
      void mutate('/api/teams');
    }
    toast.success('登录成功');
  }, [access_token]);

  return <h1 className="animate-pulse font-bold text-vines-500">正在登录中</h1>;
};

export const Route = createFileRoute('/login/callback')({
  component: LoginCallback,
  validateSearch: loginCallbackPageSearchSchema.parse,
});
