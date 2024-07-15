import React from 'react';

import { Pencil } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';

import { updateUserInfo } from '@/apis/authz/user';
import { IVinesUser } from '@/apis/authz/user/typings.ts';
import { SimpleInputDialog } from '@/components/ui/input/simple-input-dialog';

interface IUserNameProps extends React.ComponentPropsWithoutRef<'div'> {
  user: Partial<IVinesUser>;
  updateUser: (key: string, val: string) => void;
}

export const UserName: React.FC<IUserNameProps> = ({ user, updateUser }) => {
  const { t } = useTranslation();

  const handleUpdateUser = (key: string, val: string) => {
    toast.promise(
      updateUserInfo({
        [key]: val,
      } as unknown as IVinesUser),
      {
        loading: t('common.update.loading'),
        success: () => {
          updateUser(key, val);
          return t('common.update.success');
        },
        error: t('common.update.error'),
      },
    );
  };

  const userName = user.name || 'AI';

  return (
    <SimpleInputDialog
      title={t('settings.account.user.user-name.info-editor.title')}
      placeholder={t('settings.account.user.user-name.info-editor.placeholder')}
      initialValue={userName}
      onFinished={(val) => handleUpdateUser('name', val)}
    >
      <div className="group flex cursor-pointer items-center gap-2 transition-opacity hover:opacity-75">
        <h3 className="line-clamp-1 font-semibold leading-tight">{userName}</h3>
        <Pencil size={16} className="-mb-0.5 opacity-0 transition-opacity group-hover:opacity-100" />
      </div>
    </SimpleInputDialog>
  );
};
