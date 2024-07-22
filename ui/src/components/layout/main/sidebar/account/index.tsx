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
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { useLocalStorage } from '@/hooks/use-local-storage';
import VinesEvent from '@/utils/events.ts';

export const Account: React.FC = () => {
  const { t } = useTranslation();

  const [user] = useLocalStorage<Partial<IVinesUser>>('vines-account', {});

  const currentUserName = user.name;
  const currentUserPhoto = user.photo;

  return (
    <div className="flex w-full items-center justify-between p-1">
      <User name={currentUserName} photo={currentUserPhoto} photoSize={5} simple />
      <Tooltip>
        <AlertDialog>
          <AlertDialogTrigger asChild>
            <TooltipTrigger>
              <LogOut className="!stroke-red-10" strokeWidth={1.5} size={16} />
            </TooltipTrigger>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>{t('auth.users.title')}</AlertDialogTitle>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>{t('common.utils.cancel')}</AlertDialogCancel>
              <AlertDialogAction onClick={() => VinesEvent.emit('vines-logout')}>
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
