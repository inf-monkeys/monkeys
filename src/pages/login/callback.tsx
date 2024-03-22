import React from 'react';

import { createFileRoute } from '@tanstack/react-router';

import { loginCallbackPageSearchSchema } from '@/schema/common.ts';

const LoginCallback: React.FC = () => {
  return <h1 className="animate-pulse font-bold text-vines-500">正在登录中</h1>;
};

export const Route = createFileRoute('/login/callback')({
  component: LoginCallback,
  validateSearch: loginCallbackPageSearchSchema.parse,
});
