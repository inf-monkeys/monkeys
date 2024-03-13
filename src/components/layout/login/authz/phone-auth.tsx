import React, { useEffect, useState } from 'react';

import { zodResolver } from '@hookform/resolvers/zod';
import { useInterval, useTimeout } from '@mantine/hooks';
import { useForm, UseFormReturn } from 'react-hook-form';
import { toast } from 'sonner';
import { ILoginViaSms, loginViaSmsSchema } from 'src/schema/authz';

import { sendSmsVerifyCode } from '@/apis/authz';
import { AuthWrapper } from '@/components/layout/login/authz/auth-wrapper.tsx';
import { Button } from '@/components/ui/button';
import { FormControl, FormField, FormItem, FormMessage } from '@/components/ui/form.tsx';
import { Input } from '@/components/ui/input';
import { PHONE_REGEX } from '@/consts/authz';

interface IPhoneAuthProps extends React.ComponentPropsWithoutRef<'div'> {
  onFinished?: () => void;
}

export const PhoneAuth: React.FC<IPhoneAuthProps> = ({ onFinished }) => {
  const form = useForm<ILoginViaSms>({
    resolver: zodResolver(loginViaSmsSchema),
    defaultValues: {
      phoneNumber: '',
      verifyCode: '',
    },
  });

  const phone = form.watch('phoneNumber');
  const [disabledCodeInput, setDisabledCodeInput] = useState(false);
  useEffect(() => {
    if (PHONE_REGEX.test(phone)) {
      setDisabledCodeInput(false);
      form.setFocus('verifyCode');
    } else {
      setDisabledCodeInput(true);
    }
  }, [phone]);

  const [countDownSeconds, setCountDownSeconds] = useState(30);
  const interval = useInterval(() => setCountDownSeconds((s) => s - 1), 1000);
  const { start } = useTimeout(() => interval.stop(), 30000);
  const handleSandSmsCode = async (e: React.MouseEvent<HTMLButtonElement, MouseEvent>) => {
    e.preventDefault();
    setCountDownSeconds(30);
    start();
    interval.start();
    toast.promise(sendSmsVerifyCode(phone), {
      loading: '发送中...',
      success: '已发送短信验证码',
      error: '发送失败！请稍后再重试',
    });
  };

  return (
    <AuthWrapper form={form as unknown as UseFormReturn<never>} onFinished={onFinished}>
      <FormField
        name="phoneNumber"
        control={form.control}
        render={({ field }) => (
          <FormItem>
            <FormControl>
              <Input placeholder="请输入手机号" {...field} />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />

      <FormField
        name="verifyCode"
        control={form.control}
        render={({ field }) => (
          <FormItem>
            <div className="flex w-full items-center gap-4">
              <FormControl>
                <Input placeholder="请输入短信验证码" inputMode="numeric" maxLength={6} {...field} className="grow" />
              </FormControl>

              <Button disabled={disabledCodeInput || interval.active} onClick={handleSandSmsCode}>
                {interval.active ? `${countDownSeconds} s` : '发送验证码'}
              </Button>
            </div>

            <FormMessage />
          </FormItem>
        )}
      />
    </AuthWrapper>
  );
};
