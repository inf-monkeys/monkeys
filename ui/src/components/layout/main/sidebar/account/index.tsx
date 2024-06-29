import React from 'react';

import { LogOut } from 'lucide-react';
import { useTranslation } from 'react-i18next';

import { IVinesUser } from '@/apis/authz/user/typings.ts';
import { User } from '@/components/layout/main/sidebar/account/user.tsx';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { useLocalStorage } from '@/utils';
import VinesEvent from '@/utils/events.ts';
import { maskEmail, maskPhone } from '@/utils/maskdata.ts';

export const Account: React.FC = () => {
  const { t } = useTranslation();

  const [user] = useLocalStorage<Partial<IVinesUser>>('vines-account', {});

  const currentUserName = user.name;
  const currentAccount = user.phone ? maskPhone(user.phone.toString()) : user.email ? maskEmail(user.email) : '';
  const currentUserPhoto = user.photo;

  return (
    <div className="flex w-full items-center justify-between gap-2 rounded-md bg-mauve-2 p-2 shadow-sm">
      <User name={currentUserName} account={currentAccount} photo={currentUserPhoto} />
      <Tooltip>
        <AlertDialog>
          <AlertDialogTrigger asChild>
            <TooltipTrigger>
              <Button icon={<LogOut className="!stroke-red-10" strokeWidth={1.5} size={16} />} variant="borderless" />
            </TooltipTrigger>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>{t('auth.users.title')}</AlertDialogTitle>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>{t('common.utils.cancel')}</AlertDialogCancel>
              <AlertDialogAction onClick={() => VinesEvent.emit('vines-logout', user.id)}>
                {t('common.utils.confirm')}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
        <TooltipContent>{t('auth.users.logout')}</TooltipContent>
      </Tooltip>
    </div>
  );
};
