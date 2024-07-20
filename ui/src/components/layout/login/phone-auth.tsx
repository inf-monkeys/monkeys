import React, { useEffect, useState } from 'react';

import { zodResolver } from '@hookform/resolvers/zod';
import { useCountDown, useEventEmitter } from 'ahooks';
import { useForm, UseFormReturn } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';

import { sendSmsVerifyCode } from '@/apis/authz';
import { AuthMethod } from '@/apis/common/typings.ts';
import { AuthEvent, AuthWrapper } from '@/components/layout/login/auth-wrapper.tsx';
import { Button } from '@/components/ui/button';
import { FormControl, FormField, FormItem, FormMessage } from '@/components/ui/form.tsx';
import { Input } from '@/components/ui/input';
import { InputOTP, InputOTPGroup, InputOTPSlot } from '@/components/ui/input-otp.tsx';
import { PHONE_REGEX } from '@/consts/authz';
import { ILoginViaSms, loginViaSmsSchema } from '@/schema/authz';

interface IPhoneAuthProps extends React.ComponentPropsWithoutRef<'div'> {
  onFinished?: () => void;
}

export const PhoneAuth: React.FC<IPhoneAuthProps> = ({ onFinished }) => {
  const { t } = useTranslation();

  const form = useForm<ILoginViaSms>({
    resolver: zodResolver(loginViaSmsSchema),
    defaultValues: {
      phoneNumber: '',
      verifyCode: '',
    },
  });

  const event$ = useEventEmitter<AuthEvent>();

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

  const verifyCode = form.watch('verifyCode');
  useEffect(() => {
    if (verifyCode.length === 6) {
      if (PHONE_REGEX.test(phone)) {
        event$.emit('trigger-login');
      }
    }
  }, [verifyCode]);

  const [targetDate, setTargetDate] = useState<number>();

  const [countdown] = useCountDown({
    targetDate,
  });

  const handleSandSmsCode = async (e: React.MouseEvent<HTMLButtonElement, MouseEvent>) => {
    e.preventDefault();
    setTargetDate(Date.now() + 30000);
    toast.promise(sendSmsVerifyCode(phone), {
      loading: t('auth.login.send-sms.loading'),
      success: t('auth.login.send-sms.success'),
      error: t('auth.login.send-sms.error'),
    });
  };

  event$.useSubscription((mode) => {
    if (mode === 'clear-sms-code-input') {
      form.setValue('verifyCode', '');
    }
  });

  return (
    <AuthWrapper
      form={form as unknown as UseFormReturn<never>}
      onFinished={onFinished}
      method={AuthMethod.phone}
      event$={event$}
    >
      <FormField
        name="phoneNumber"
        control={form.control}
        render={({ field }) => (
          <FormItem>
            <FormControl>
              <Input placeholder={t('auth.login.phone-placeholder')} {...field} />
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
            <div className="flex w-full items-center justify-between gap-2">
              <FormControl>
                <InputOTP maxLength={6} {...field}>
                  <InputOTPGroup>
                    <InputOTPSlot index={0} />
                    <InputOTPSlot index={1} />
                    <InputOTPSlot index={2} />
                    <InputOTPSlot index={3} />
                    <InputOTPSlot index={4} />
                    <InputOTPSlot index={5} />
                  </InputOTPGroup>
                </InputOTP>
              </FormControl>

              <Button
                className="flex-1"
                disabled={disabledCodeInput || countdown !== 0}
                onClick={handleSandSmsCode}
                size="small"
              >
                {countdown === 0 ? t('auth.login.send-sms.button') : `${Math.round(countdown / 1000)} s`}
              </Button>
            </div>

            <FormMessage />
          </FormItem>
        )}
      />
    </AuthWrapper>
  );
};
