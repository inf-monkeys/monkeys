import React, { useEffect, useState } from 'react';

import { zodResolver } from '@hookform/resolvers/zod';
import { useCountDown } from 'ahooks';
import { Pencil } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';

import { sendSmsVerifyCode } from '@/apis/authz';
import { updateUserInfo } from '@/apis/authz/user';
import { IVinesUser } from '@/apis/authz/user/typings.ts';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Form, FormControl, FormField, FormItem, FormMessage } from '@/components/ui/form.tsx';
import { Input } from '@/components/ui/input';
import { PHONE_REGEX, VERIFY_CODE_REGEX } from '@/consts/authz';
import { IToggleAccountViaSms, toggleAccountViaSmsSchema } from '@/schema/authz/toggle-account.ts';
import { maskEmail, maskPhone } from '@/utils/maskdata.ts';

interface IUserAccountProps extends React.ComponentPropsWithoutRef<'div'> {
  user: Partial<IVinesUser>;
  updateUser: (key: string, val: string) => void;
}

export const UserAccount: React.FC<IUserAccountProps> = ({ user, updateUser }) => {
  const { t } = useTranslation();

  const [visible, setVisible] = useState(false);

  const form = useForm<IToggleAccountViaSms>({
    resolver: zodResolver(toggleAccountViaSmsSchema),
    defaultValues: {
      phoneNumber: '',
      verifyCode: '',
      oldVerifyCode: '',
    },
  });

  const phone = form.watch('phoneNumber');
  const [disabledCodeInput, setDisabledCodeInput] = useState(false);
  useEffect(() => {
    if (PHONE_REGEX.test(phone)) {
      if (phone === user.phone?.toString()) {
        form.setError('phoneNumber', { type: 'manual', message: '新手机号不能与旧手机号相同' });
      } else {
        setDisabledCodeInput(false);
        form.setFocus('verifyCode');
        form.clearErrors('phoneNumber');
      }
    } else {
      setDisabledCodeInput(true);
    }
  }, [phone]);

  const originVerifyCode = form.watch('oldVerifyCode');
  useEffect(() => {
    if (VERIFY_CODE_REGEX.test(originVerifyCode)) {
      form.setFocus('phoneNumber');
    }
  }, [originVerifyCode]);

  const [originTargetDate, setOriginTargetDate] = useState<number>();
  const [originCountdown] = useCountDown({
    targetDate: originTargetDate,
  });

  const [targetDate, setTargetDate] = useState<number>();
  const [countdown] = useCountDown({
    targetDate,
  });

  const handleSandSmsCode = async (e: React.MouseEvent<HTMLButtonElement, MouseEvent>, _phone?: string) => {
    e.preventDefault();
    if (_phone) {
      setOriginTargetDate(Date.now() + 30000);
    } else {
      setTargetDate(Date.now() + 30000);
    }
    const finalPhone = _phone ? _phone : phone;
    toast.promise(sendSmsVerifyCode(finalPhone), {
      loading: t('common.sms-verify.loading'),
      success: t('common.sms-verify.success', { phone: finalPhone }),
      error: t('common.sms-verify.error'),
    });
  };

  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = form.handleSubmit(({ oldVerifyCode, verifyCode, phoneNumber }) => {
    setIsLoading(true);
    toast.promise(
      updateUserInfo({
        phoneNumber,
        verifyCode: Number(verifyCode),
        oldPhoneNumber: user.phone ?? '',
        oldVerifyCode: Number(oldVerifyCode),
      }),
      {
        loading: t('common.update.loading'),
        success: (data) => {
          data && updateUser('phone', phoneNumber);
          setIsLoading(false);
          setVisible(false);
          return t('common.update.success');
        },
        error: t('common.update.error'),
        finally: () => setIsLoading(false),
      },
    );
  });

  const currentAccount = user.phone ? maskPhone(user.phone.toString()) : user.email ? maskEmail(user.email) : '';

  return (
    <Dialog
      open={visible}
      onOpenChange={(val) =>
        user.phone ? setVisible(val) : toast.warning(t('settings.account.user.user-account.not-phone-toast'))
      }
    >
      <DialogTrigger>
        <div className="group flex cursor-pointer items-center gap-2 transition-opacity hover:opacity-75">
          <h3 className="line-clamp-1 text-xs">{currentAccount}</h3>
          <Pencil size={12} className="opacity-0 transition-opacity group-hover:opacity-100" />
        </div>
      </DialogTrigger>
      <DialogContent className="max-w-96">
        <DialogHeader>
          <DialogTitle>{t('settings.account.user.user-account.title')}</DialogTitle>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={handleSubmit} className="flex flex-col gap-2">
            <div className="mb-2 space-y-2">
              <Input
                placeholder={t('settings.account.user.user-account.old-phone')}
                value={currentAccount}
                readOnly
                autoFocus={false}
              />
            </div>

            <FormField
              name="oldVerifyCode"
              control={form.control}
              render={({ field }) => (
                <FormItem>
                  <div className="flex w-full items-center gap-4">
                    <FormControl>
                      <Input
                        placeholder={t('settings.account.user.user-account.old-phone-code-placeholder')}
                        inputMode="numeric"
                        maxLength={6}
                        {...field}
                        className="grow"
                        autoFocus
                      />
                    </FormControl>

                    <Button onClick={(e) => handleSandSmsCode(e, user.phone)}>
                      {originCountdown === 0
                        ? t('common.sms-verify.send-button')
                        : `${Math.round(originCountdown / 1000)} s`}
                    </Button>
                  </div>

                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              name="phoneNumber"
              control={form.control}
              render={({ field }) => (
                <FormItem>
                  <FormControl>
                    <Input placeholder={t('settings.account.user.user-account.new-phone-placeholder')} {...field} />
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
                      <Input
                        placeholder={t('settings.account.user.user-account.new-phone-code-placeholder')}
                        inputMode="numeric"
                        maxLength={6}
                        {...field}
                        className="grow"
                      />
                    </FormControl>

                    <Button disabled={disabledCodeInput || countdown !== 0} onClick={handleSandSmsCode}>
                      {countdown === 0 ? t('common.sms-verify.send-button') : `${Math.round(countdown / 1000)} s`}
                    </Button>
                  </div>

                  <FormMessage />
                </FormItem>
              )}
            />

            <Button type="submit" loading={isLoading} variant="solid">
              {t('common.utils.confirm')}
            </Button>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};
