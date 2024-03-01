import React, { useCallback, useEffect, useMemo, useState } from 'react';

import { toast } from 'sonner';

import { useUpdateUserInfo } from '@/apis/settings/user.ts';
import { IUser } from '@/components/router/guard/auth.ts';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input.tsx';
import { SettingsHeader } from '@/pages/$teamId/settings/header.lazy.tsx';
import { ToggleUserPhoneDialog } from '@/pages/$teamId/settings/user/toggle-user-phone-dialog.lazy.tsx';
import { useLocalStorage } from '@/utils';
import { maskPhone } from '@/utils/maskdata.ts';

interface ISettingsUserHeaderProps extends React.ComponentPropsWithoutRef<'div'> {
  readonly?: boolean;
  buttons?: React.ReactNode;
}

export const SettingsUserHeader: React.FC<ISettingsUserHeaderProps> = ({ readonly = false, buttons, children }) => {
  const [user, setUser] = useLocalStorage<Partial<IUser>>('vines-account', {});

  const { trigger, data } = useUpdateUserInfo();

  const [dialogInputOptions, setDialogInputOptions] = useState<{
    type: 'name';
    placeholder: string;
    value: string;
  } | null>(null);

  const [toggleUserPhoneDialogOpen, setToggleUserPhoneDialogOpen] = useState(false);

  const handleNameClick = useMemo(() => {
    return readonly
      ? undefined
      : () =>
          setDialogInputOptions({
            type: 'name',
            value: user.name || '',
            placeholder: '昵称',
          });
  }, [readonly, user.name]);

  const handleDescClick = useMemo(() => {
    return readonly ? undefined : () => setToggleUserPhoneDialogOpen(true);
  }, [readonly]);

  const handleAvatarClick = useMemo(() => {
    return readonly ? undefined : () => {};
  }, [readonly]);

  const handleLogout = useCallback(() => {
    if (typeof window === 'undefined') return;
    localStorage.clear();
    toast.success('已成功退出，正在跳转...');
    setTimeout(() => (window.location.href = '/'), 500);
  }, []);

  const handleInputValue = useCallback(async () => {
    if (!dialogInputOptions) return;
    const { type, value } = dialogInputOptions;
    if (!value) {
      toast.warning('请检查输入');
      return;
    }
    toast.promise(
      trigger({
        [type]: value,
      }),
      {
        loading: '更新中...',
        error: '更新失败！请稍后再重试',
      },
    );
    setDialogInputOptions(null);
  }, [dialogInputOptions]);

  useEffect(() => {
    if (!data) return;
    toast.success('已更新');
    setUser(data);
  }, [data]);

  return (
    <>
      <SettingsHeader
        avatarUrl={user.photo}
        name={user.name}
        desc={user.phone ? maskPhone(user.phone.toString()) : ''}
        onAvatarClick={handleAvatarClick}
        onNameClick={handleNameClick}
        onDescClick={handleDescClick}
        buttons={
          !readonly &&
          (buttons ?? (
            <>
              <Button theme="danger" size="large" onClick={() => handleLogout()}>
                退出登录
              </Button>
            </>
          ))
        }
      >
        {children}
      </SettingsHeader>
      {dialogInputOptions ? (
        <Dialog open onClose={() => setDialogInputOptions(null)}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{`请输入${dialogInputOptions?.placeholder}`}</DialogTitle>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <Input
                placeholder="16 字内，仅内部可见"
                maxLength={16}
                value={dialogInputOptions.value}
                onChange={(v) => setDialogInputOptions({ ...dialogInputOptions, value: v.target.value })}
              />
            </div>
            <DialogFooter>
              <Button onClick={() => setDialogInputOptions(null)}>取消</Button>
              <Button variant="solid" onClick={() => handleInputValue()}>
                保存
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      ) : null}
      <ToggleUserPhoneDialog open={toggleUserPhoneDialogOpen} onClose={() => setToggleUserPhoneDialogOpen(false)} />
    </>
  );
};
