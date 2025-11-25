import React from 'react';

import { useForm, UseFormReturn } from 'react-hook-form';
import { useTranslation } from 'react-i18next';

import { AuthMethod } from '@/apis/common/typings.ts';
import { AuthWrapper, IAuthWrapperOptions } from '@/components/layout/login/auth/auth-wrapper.tsx';
import { FormControl, FormField, FormItem, FormMessage } from '@/components/ui/form.tsx';
import { Input } from '@/components/ui/input';
import { ILoginViaMail, loginViaMailSchema } from '@/schema/authz';

const customResolver = async (data: ILoginViaMail) => {
  try {
    const validated = await loginViaMailSchema.parseAsync(data);
    return { values: validated, errors: {} };
  } catch (error) {
    const errors: Record<string, { message: string }> = {};
    if (error instanceof Error && 'issues' in error) {
      const issues = (error as any).issues as Array<{ path: (string | number)[]; message: string }>;
      issues.forEach((issue) => {
        const path = String(issue.path[0]);
        if (path) {
          errors[path] = { message: issue.message };
        }
      });
    }
    return { values: {}, errors };
  }
};

export const EmailAuth: React.FC<IAuthWrapperOptions> = ({
  onFinished,
  buttonContent,
  buttonIcon,
  onLoginFinished,
}) => {
  const { t } = useTranslation();

  const form = useForm<ILoginViaMail>({
    resolver: customResolver,
    mode: 'onChange',
    defaultValues: {
      email: '',
      password: '',
    },
  });



  return (
    <AuthWrapper
      form={form as unknown as UseFormReturn<never>}
      onFinished={onFinished}
      method={AuthMethod.password}
      buttonContent={buttonContent}
      buttonIcon={buttonIcon}
      onLoginFinished={onLoginFinished}
    >
      <FormField
        name="email"
        control={form.control}
        render={({ field }) => (
          <FormItem>
            <FormControl>
              <Input placeholder={t('auth.login.email-placeholder')} {...field} />
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
              <Input type="password" placeholder={t('auth.login.password-placeholder')} {...field} />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />
    </AuthWrapper>
  );
};
