import React from 'react';

import { zodResolver } from '@hookform/resolvers/zod';
import { useForm, UseFormReturn } from 'react-hook-form';

import { AuthWrapper } from '@/components/layout/login/authz/auth-wrapper.tsx';
import { FormControl, FormField, FormItem, FormMessage } from '@/components/ui/form.tsx';
import { Input } from '@/components/ui/input.tsx';
import { ILoginViaMail, loginViaMailSchema } from '@/shema/authz';

interface IEmailAuthProps extends React.ComponentPropsWithoutRef<'div'> {}

export const EmailAuth: React.FC<IEmailAuthProps> = () => {
  const form = useForm<ILoginViaMail>({
    resolver: zodResolver(loginViaMailSchema),
    defaultValues: {
      email: '',
      password: '',
    },
  });

  return (
    <AuthWrapper form={form as unknown as UseFormReturn<never>}>
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
