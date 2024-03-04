import React from 'react';

import { zodResolver } from '@hookform/resolvers/zod';
import { useForm, UseFormReturn } from 'react-hook-form';
import { ILoginViaMail, loginViaMailSchema } from 'src/schema/authz';

import { AuthWrapper } from '@/components/layout/login/authz/auth-wrapper.tsx';
import { FormControl, FormField, FormItem, FormMessage } from '@/components/ui/form.tsx';
import { Input } from '@/components/ui/input.tsx';

interface IEmailAuthProps extends React.ComponentPropsWithoutRef<'div'> {
  onFinished?: () => void;
}

export const EmailAuth: React.FC<IEmailAuthProps> = ({ onFinished }) => {
  const form = useForm<ILoginViaMail>({
    resolver: zodResolver(loginViaMailSchema),
    defaultValues: {
      email: '',
      password: '',
    },
  });

  return (
    <AuthWrapper form={form as unknown as UseFormReturn<never>} onFinished={onFinished}>
      <FormField
        name="email"
        control={form.control}
        render={({ field }) => (
          <FormItem>
            <FormControl>
              <Input placeholder="请输入邮箱" {...field} />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />

      <FormField
        name="password"
        control={form.control}
        render={({ field }) => (
          <FormItem>
            <FormControl>
              <Input type="password" placeholder="请输入密码" {...field} />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />
    </AuthWrapper>
  );
};
