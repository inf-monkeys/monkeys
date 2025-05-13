import React, { useState } from 'react';

import { Link, Settings, UsersIcon } from 'lucide-react';
import { useTranslation } from 'react-i18next';

import { InviteManage } from '@/components/layout/settings/account/team-member/invite/invite-manage';
import { InviteUser } from '@/components/layout/settings/account/team-member/invite/invite-user';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuShortcut,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu.tsx';
import { Tooltip } from '@/components/ui/tooltip';

export const HeaderInvite: React.FC = () => {
  const { t } = useTranslation();

  const [inviteUserDialogVisible, setInviteUserDialogVisible] = useState(false);
  const [inviteManageDialogVisible, setInviteManageDialogVisible] = useState(false);

  return (
    <>
      <DropdownMenu>
        <Tooltip content={t('settings.account.team-member.invite.header-button-tooltip')}>
          <DropdownMenuTrigger asChild>
            <Button icon={<UsersIcon />} size="small" variant="outline">
              {t('settings.account.team-member.invite.header-button-tooltip')}
            </Button>
          </DropdownMenuTrigger>
        </Tooltip>
        <DropdownMenuContent>
          <DropdownMenuLabel>{t('settings.account.team-member.invite.dropdown-label')}</DropdownMenuLabel>
          <DropdownMenuSeparator />
          <DropdownMenuGroup>
            <DropdownMenuItem onSelect={() => setInviteUserDialogVisible(true)}>
              <DropdownMenuShortcut className="ml-0 mr-2 mt-0.5">
                <Link size={15} />
              </DropdownMenuShortcut>
              {t('settings.account.team-member.invite.invite-user.button')}
            </DropdownMenuItem>
            <DropdownMenuItem onSelect={() => setInviteManageDialogVisible(true)}>
              <DropdownMenuShortcut className="ml-0 mr-2 mt-0.5">
                <Settings size={15} />
              </DropdownMenuShortcut>
              {t('settings.account.team-member.invite.invite-manage.button')}
            </DropdownMenuItem>
          </DropdownMenuGroup>
        </DropdownMenuContent>
      </DropdownMenu>

      <InviteUser visible={inviteUserDialogVisible} setVisible={setInviteUserDialogVisible} />
      <InviteManage visible={inviteManageDialogVisible} setVisible={setInviteManageDialogVisible} />
    </>
  );
};
