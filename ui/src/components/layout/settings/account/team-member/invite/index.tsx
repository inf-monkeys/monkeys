import React, { useState } from 'react';

import { Link, Settings, Share } from 'lucide-react';
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

export const Invite: React.FC = () => {
  const { t } = useTranslation();

  const [inviteUserDialogVisible, setInviteUserDialogVisible] = useState(false);
  const [inviteManageDialogVisible, setInviteManageDialogVisible] = useState(false);

  return (
    <>
      <DropdownMenu>
        <Tooltip content={t('settings.account.team-member.invite.button-tooltip')}>
          <DropdownMenuTrigger asChild>
            <Button icon={<Share />} size="small" />
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
              {t('settings.account.team-member.invite.invite-user.index')}
            </DropdownMenuItem>
            <DropdownMenuItem onSelect={() => setInviteManageDialogVisible(true)}>
              <DropdownMenuShortcut className="ml-0 mr-2 mt-0.5">
                <Settings size={15} />
              </DropdownMenuShortcut>
              {t('settings.account.team-member.invite.invite-manage.index')}
            </DropdownMenuItem>
          </DropdownMenuGroup>
        </DropdownMenuContent>
      </DropdownMenu>

      <InviteUser visible={inviteUserDialogVisible} setVisible={setInviteUserDialogVisible} />
      <InviteManage visible={inviteManageDialogVisible} setVisible={setInviteManageDialogVisible} />
    </>
  );
};
