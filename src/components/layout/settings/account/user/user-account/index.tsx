import React, { useEffect, useState } from 'react';

import { zodResolver } from '@hookform/resolvers/zod';
import { useInterval, useTimeout } from '@mantine/hooks';
import { Pencil } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';

import { sendSmsVerifyCode } from '@/apis/authz';
import { updateUserInfo } from '@/apis/authz/user';
import { IVinesUser } from '@/apis/authz/user/typings.ts';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Form, FormControl, FormField, FormItem, FormMessage } from '@/components/ui/form.tsx';
import { Input } from '@/components/ui/input.tsx';
import { PHONE_REGEX, VERIFY_CODE_REGEX } from '@/consts/authz';
import { IToggleAccountViaSms, toggleAccountViaSmsSchema } from '@/shema/authz/toggle-account.ts';
import { maskEmail, maskPhone } from '@/utils/maskdata.ts';

interface IUserAccountProps extends React.ComponentPropsWithoutRef<'div'> {
  user: Partial<IVinesUser>;
  setUser: React.Dispatch<React.SetStateAction<Partial<IVinesUser>>>;
}

export const UserAccount: React.FC<IUserAccountProps> = ({ user, setUser }) => {
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

  const [originCountDownSeconds, setOriginCountDownSeconds] = useState(30);
  const originInterval = useInterval(() => setOriginCountDownSeconds((s) => s - 1), 1000);
  const { start: originStart } = useTimeout(() => originInterval.stop(), 30000);

  const [countDownSeconds, setCountDownSeconds] = useState(30);
  const interval = useInterval(() => setCountDownSeconds((s) => s - 1), 1000);
  const { start } = useTimeout(() => interval.stop(), 30000);

  const handleSandSmsCode = async (e: React.MouseEvent<HTMLButtonElement, MouseEvent>, _phone?: string) => {
    e.preventDefault();
    if (_phone) {
      setOriginCountDownSeconds(30);
      originStart();
      originInterval.start();
    } else {
      setCountDownSeconds(30);
      start();
      interval.start();
    }
    const finalPhone = _phone ? _phone : phone;
    toast.promise(sendSmsVerifyCode(finalPhone), {
      loading: '发送中...',
      success: `已发送短信验证码至 ${finalPhone} 请注意查收`,
      error: '发送失败！请稍后再重试',
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
        loading: '正在修改中...',
        success: (data) => {
          data && setUser(data);
          setIsLoading(false);
          setVisible(false);
          return '修改成功！';
        },
        error: '修改失败，请检查网络是否通畅',
        finally: () => setIsLoading(false),
      },
    );
  });

  const currentAccount = user.phone ? maskPhone(user.phone.toString()) : user.email ? maskEmail(user.email) : '';

  return (
    <Dialog
      open={visible}
      onOpenChange={(val) => (user.phone ? setVisible(val) : toast.warning('暂时仅支持修改手机号'))}
    >
      <DialogTrigger>
        <div className="group flex cursor-pointer items-center gap-2 transition-opacity hover:opacity-75">
          <h3 className="line-clamp-1 text-xs">{currentAccount}</h3>
          <Pencil size={12} className="opacity-0 transition-opacity group-hover:opacity-100" />
        </div>
      </DialogTrigger>
      <DialogContent className="max-w-96">
        <DialogHeader>
          <DialogTitle>更改手机号</DialogTitle>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={handleSubmit} className="flex flex-col gap-2">
            <div className="mb-2 space-y-2">
              <Input placeholder="旧手机号" value={currentAccount} readOnly autoFocus={false} />
            </div>

            <FormField
              name="oldVerifyCode"
              control={form.control}
              render={({ field }) => (
                <FormItem>
                  <div className="flex w-full items-center gap-4">
                    <FormControl>
                      <Input
                        placeholder="请输入旧手机号短信验证码"
                        inputMode="numeric"
                        maxLength={6}
                        {...field}
                        className="grow"
                        autoFocus
                      />
                    </FormControl>

                    <Button onClick={(e) => handleSandSmsCode(e, user.phone)}>
                      {originInterval.active ? `${originCountDownSeconds} s` : '发送验证码'}
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
                    <Input placeholder="请输入新手机号" {...field} />
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
                        placeholder="请输入短信验证码"
                        inputMode="numeric"
                        maxLength={6}
                        {...field}
                        className="grow"
                      />
                    </FormControl>

                    <Button disabled={disabledCodeInput || interval.active} onClick={handleSandSmsCode}>
                      {interval.active ? `${countDownSeconds} s` : '发送验证码'}
                    </Button>
                  </div>

                  <FormMessage />
                </FormItem>
              )}
            />

            <Button type="submit" loading={isLoading} variant="solid">
              确定
            </Button>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};
