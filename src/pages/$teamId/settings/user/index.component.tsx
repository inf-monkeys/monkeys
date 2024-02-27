import React, { useCallback, useEffect, useState } from 'react';

import { Pencil } from 'lucide-react';
import { toast } from 'sonner';

import { useUpdateUserInfo } from '@/apis/settings/user.ts';
import { IUser } from '@/components/router/guard/auth.ts';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar.tsx';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input.tsx';
import { Tooltip } from '@/components/ui/tooltip';
import { ToggleUserPhoneModal } from '@/pages/$teamId/settings/user/toggle-user-phone-modal.component.tsx';
import { useLocalStorage } from '@/utils';
import { maskPhone } from '@/utils/maskdata.ts';

export const UserSettings: React.FC = () => {
  const [user, setUser] = useLocalStorage<Partial<IUser>>('vines-account', {});

  const { trigger, data } = useUpdateUserInfo();

  const [modalInputOptions, setModalInputOptions] = useState<{
    type: 'name';
    placeholder: string;
    value: string;
  } | null>(null);

  const [toggleUserPhoneModalVisible, setToggleUserPhoneModalVisible] = useState(false);

  const handleLogout = useCallback(() => {
    if (typeof window === 'undefined') return;
    localStorage.clear();
    toast.success('已成功退出，正在跳转...');
    setTimeout(() => (window.location.href = '/'), 500);
  }, []);

  const handleInputValue = useCallback(async () => {
    if (!modalInputOptions) return;
    const { type, value } = modalInputOptions;
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
    setModalInputOptions(null);
  }, [modalInputOptions]);

  useEffect(() => {
    if (!data) return;
    toast.success('已更新');
    setUser(data);
  }, [data]);

  return (
    <>
      <div className="flex w-full flex-col gap-3">
        <span className="whitespace-nowrap text-lg font-bold">个人中心</span>
        <div className="flex w-[calc(100vw-14rem-4rem-8rem)] flex-col items-center overflow-y-auto text-xs">
          <div className="flex w-full flex-grow items-center justify-between gap-4 rounded-lg border-[1px] border-border p-4">
            <div className="flex items-center gap-4">
              <div className="group relative cursor-pointer">
                <Tooltip content="点击修改头像">
                  <Avatar className="size-9">
                    <AvatarImage className="aspect-auto" src={user.photo} alt={user.name} />
                    <AvatarFallback className="rounded-none p-2 text-xs">
                      {(user.name ?? 'AI').substring(0, 2)}
                    </AvatarFallback>
                  </Avatar>
                </Tooltip>
              </div>
              <div className="flex flex-col justify-center">
                <div
                  className="group flex cursor-pointer items-center gap-2 transition-all hover:opacity-75"
                  onClick={() =>
                    setModalInputOptions({
                      type: 'name',
                      value: user.name || '',
                      placeholder: '昵称',
                    })
                  }
                >
                  <h3 className="line-clamp-1 text-sm font-bold">{user.name}</h3>
                  <Pencil size={10} className="opacity-0 transition-all group-hover:opacity-100" />
                </div>
                <div
                  className="group flex cursor-pointer items-center gap-2 transition-all hover:opacity-75"
                  onClick={() => setToggleUserPhoneModalVisible(true)}
                >
                  <h3 className="text-text2 line-clamp-1 text-xs">
                    {user.phone ? maskPhone(user.phone.toString()) : ''}
                  </h3>
                  <Pencil size={10} className="opacity-0 transition-all group-hover:opacity-100" />
                </div>
              </div>
            </div>

            <Button theme="danger" size="large" onClick={() => handleLogout()}>
              退出登录
            </Button>
          </div>
        </div>
      </div>
      {modalInputOptions ? (
        <Dialog open onClose={() => setModalInputOptions(null)}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{`请输入${modalInputOptions?.placeholder}`}</DialogTitle>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <Input
                placeholder="16 字内，仅内部可见"
                maxLength={16}
                value={modalInputOptions.value}
                onChange={(v) => setModalInputOptions({ ...modalInputOptions, value: v.target.value })}
              />
            </div>
            <DialogFooter>
              <Button onClick={() => setModalInputOptions(null)}>取消</Button>
              <Button variant="solid" onClick={() => handleInputValue()}>
                保存
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      ) : null}
      <ToggleUserPhoneModal
        visible={toggleUserPhoneModalVisible}
        onClose={() => setToggleUserPhoneModalVisible(false)}
      />
    </>
  );
};
