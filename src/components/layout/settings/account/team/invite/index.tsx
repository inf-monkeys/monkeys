import React, { useState } from 'react';

import { Link, Settings, Share } from 'lucide-react';

import { InviteManage } from '@/components/layout/settings/account/team/invite/invite-manage';
import { InviteUser } from '@/components/layout/settings/account/team/invite/invite-user';
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

interface IInviteProps extends React.ComponentPropsWithoutRef<'div'> {}

export const Invite: React.FC<IInviteProps> = ({}) => {
  const [inviteUserDialogVisible, setInviteUserDialogVisible] = useState(false);
  const [inviteManageDialogVisible, setInviteManageDialogVisible] = useState(false);

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button icon={<Share />} size="small">
            邀请用户
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent>
          <DropdownMenuLabel>邀请用户</DropdownMenuLabel>
          <DropdownMenuSeparator />
          <DropdownMenuGroup>
            <DropdownMenuItem onSelect={() => setInviteUserDialogVisible(true)}>
              <DropdownMenuShortcut className="ml-0 mr-2 mt-0.5">
                <Link size={15} />
              </DropdownMenuShortcut>
              生成邀请链接
            </DropdownMenuItem>
            <DropdownMenuItem onSelect={() => setInviteManageDialogVisible(true)}>
              <DropdownMenuShortcut className="ml-0 mr-2 mt-0.5">
                <Settings size={15} />
              </DropdownMenuShortcut>
              管理邀请链接
            </DropdownMenuItem>
          </DropdownMenuGroup>
        </DropdownMenuContent>
      </DropdownMenu>

      <InviteUser visible={inviteUserDialogVisible} setVisible={setInviteUserDialogVisible} />
      <InviteManage visible={inviteManageDialogVisible} setVisible={setInviteManageDialogVisible} />
    </>
  );
};
