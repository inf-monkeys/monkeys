import React, { useCallback, useEffect, useMemo, useState } from 'react';

import { Info } from 'lucide-react';
import { toast } from 'sonner';

import { useSmsVerifyCode } from '@/apis/authz';
import { useUpdateUserInfo } from '@/apis/settings/user.ts';
import { IUser } from '@/components/router/guard/auth.ts';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input.tsx';
import { Label } from '@/components/ui/label.tsx';
import { useLocalStorage } from '@/utils';
import { maskPhone } from '@/utils/maskdata.ts';

interface Props {
  visible: boolean;
  onClose: () => void;
}

export const ToggleUserPhoneModal: React.FC<Props> = ({ visible, onClose }) => {
  const [user, setUser] = useLocalStorage<Partial<IUser>>('vines-account', {});

  const { trigger, data } = useUpdateUserInfo();
  const { trigger: smsTrigger } = useSmsVerifyCode();

  const [oldPhoneVerifyCode, setOldPhoneVerifyCode] = useState('');
  const oldPhoneNumber = useMemo(() => user.phone?.toString() ?? '', [user.phone]);
  const [newPhoneNumber, setNewPhoneNumber] = useState('');
  const [newPhoneVerifyCode, setNewPhoneVerifyCode] = useState('');

  const [oldPhoneVerifyCodeVerify, setOldPhoneVerifyCodeVerify] = useState(false);
  const [newPhoneNumberVerify, setNewPhoneNumberVerify] = useState(false);
  const [newPhoneVerifyCodeVerify, setNewPhoneVerifyCodeVerify] = useState(false);

  const [countdown, setCountdown] = useState(0);
  const [newCountdown, setNewCountdown] = useState(0);

  useEffect(() => {
    if (countdown > 0) {
      setTimeout(() => setCountdown(countdown - 1), 1000);
    }
    if (newCountdown > 0) {
      setTimeout(() => setNewCountdown(newCountdown - 1), 1000);
    }
  }, [countdown, newCountdown]);

  const handleSendSms = useCallback(
    async (type: 'old' | 'new') => {
      const sendPhoneNumber = type === 'old' ? oldPhoneNumber : newPhoneNumber;
      if (!sendPhoneNumber) return;
      if (type === 'new' && !newPhoneNumberVerify) return;
      toast.promise(smsTrigger({ phoneNumber: sendPhoneNumber }), {
        loading: '发送中...',
        success: '已发送短信验证码',
        error: '发送失败！请稍后再重试',
      });
      if (type === 'old') {
        setCountdown(60);
      } else {
        setNewCountdown(60);
      }
    },
    [oldPhoneNumber, newPhoneNumber, newPhoneNumberVerify],
  );

  const handleValidatePhoneNumber = useCallback(async () => {
    toast.promise(
      trigger({
        phoneNumber: newPhoneNumber,
        verifyCode: Number(newPhoneVerifyCode),
        ...(oldPhoneNumber ? { oldPhoneNumber: oldPhoneNumber, oldVerifyCode: Number(oldPhoneVerifyCode) } : {}),
      }),
      {
        loading: '更新中...',
        error: '更新失败！请稍后再重试',
      },
    );
  }, [oldPhoneNumber, oldPhoneVerifyCode, newPhoneNumber, newPhoneVerifyCode]);

  useEffect(() => {
    if (data) {
      setUser(data);
      toast.success('修改成功');

      setNewPhoneNumber('');
      setNewPhoneVerifyCode('');
      setOldPhoneVerifyCode('');

      onClose?.();
    }
  }, [data]);

  return (
    <Dialog open={visible} onClose={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>更改手机号</DialogTitle>
        </DialogHeader>
        <div className="flex flex-col gap-4">
          <div className="bg-bg2 flex w-full items-center gap-2 rounded-sm p-2 shadow-sm">
            <Info className="text-danger" />
            <p className="text-danger">为了您的账号安全，进行敏感操作前须先验证身份</p>
          </div>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="old-phone-number" className="text-right">
                原始手机
              </Label>
              <Input id="old-phone-number" className="col-span-3" value={maskPhone(oldPhoneNumber)} readOnly />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="old-phone-verify-code" className="text-right">
                短信验证码
              </Label>
              <Input
                id="old-phone-verify-code"
                className="col-span-2"
                placeholder="6 位数字验证码"
                max={6}
                onChange={(v) => {
                  setOldPhoneVerifyCode(v.target.value);
                  setOldPhoneVerifyCodeVerify(v.target.value.length === 6 && !isNaN(Number(v.target.value)));
                }}
                value={oldPhoneVerifyCode}
              />
              <Button className="col-span-1 flex-shrink" disabled={countdown > 0} onClick={() => handleSendSms('old')}>
                {countdown > 0 ? `${countdown} S` : '获取验证码'}
              </Button>
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="new-phone-number" className="text-right">
                新手机号
              </Label>
              <Input
                id="new-phone-number"
                placeholder="请输入新的手机号"
                className="col-span-3"
                onChange={(v) => {
                  setNewPhoneNumber(v.target.value);
                  setNewPhoneNumberVerify(!isNaN(Number(v.target.value)) && /^1[3456789]\d{9}$/.test(v.target.value));
                }}
                value={newPhoneNumber}
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="new-phone-verify-code" className="text-right">
                短信验证码
              </Label>
              <Input
                id="new-phone-verify-code"
                className="col-span-2"
                placeholder="6 位数字验证码"
                max={6}
                disabled={!newPhoneNumberVerify}
                onChange={(v) => {
                  setNewPhoneVerifyCode(v.target.value);
                  setNewPhoneVerifyCodeVerify(v.target.value.length === 6 && !isNaN(Number(v.target.value)));
                }}
                value={newPhoneVerifyCode}
              />
              <Button
                className="col-span-1 flex-shrink"
                disabled={newCountdown > 0 || !newPhoneNumberVerify}
                onClick={() => handleSendSms('new')}
              >
                {newCountdown > 0 ? `${newCountdown} S` : '获取验证码'}
              </Button>
            </div>
          </div>
        </div>
        <DialogFooter>
          <Button onClick={() => onClose()}>取消</Button>
          <Button
            variant="solid"
            onClick={() => handleValidatePhoneNumber()}
            disabled={!(oldPhoneVerifyCodeVerify && newPhoneNumberVerify && newPhoneVerifyCodeVerify)}
          >
            确定
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
