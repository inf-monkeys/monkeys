import React from 'react';

import { Pencil } from 'lucide-react';
import { toast } from 'sonner';

import { updateUserInfo } from '@/apis/authz/user';
import { IVinesUser } from '@/apis/authz/user/typings.ts';
import { InfoEditor } from '@/components/layout/settings/account/info-editor.tsx';

interface IUserNameProps extends React.ComponentPropsWithoutRef<'div'> {
  user: Partial<IVinesUser>;
  setUser: React.Dispatch<React.SetStateAction<Partial<IVinesUser>>>;
}

export const UserName: React.FC<IUserNameProps> = ({ user, setUser }) => {
  const handleUpdateUser = (key: string, val: string) => {
    toast.promise(
      updateUserInfo({
        [key]: val,
      } as unknown as IVinesUser),
      {
        loading: '更新中...',
        success: () => {
          setUser({ ...user, [key]: val });
          return '更新成功！';
        },
        error: '更新失败！请稍后再重试',
      },
    );
  };

  const userName = user.name || 'AI';

  return (
    <InfoEditor
      title="编辑昵称"
      placeholder="输入昵称，16 字以内"
      initialValue={userName}
      onFinished={(val) => handleUpdateUser('name', val)}
    >
      <div className="group flex cursor-pointer items-center gap-2 transition-opacity hover:opacity-75">
        <h3 className="line-clamp-1 font-semibold leading-tight">{userName}</h3>
        <Pencil size={16} className="-mb-0.5 opacity-0 transition-opacity group-hover:opacity-100" />
      </div>
    </InfoEditor>
  );
};
