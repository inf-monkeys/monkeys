import React, { useCallback, useMemo, useState } from 'react';

import { ChevronDown } from 'lucide-react';
import { toast } from 'sonner';

import { useTeams } from '@/apis/authz/team';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogFooter, DialogTitle } from '@/components/ui/dialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu.tsx';
import { Input } from '@/components/ui/input.tsx';
import { SettingsHeader } from '@/pages/$teamId/settings/header.lazy.tsx';
import { InviteUserDialog } from '@/pages/$teamId/settings/team-header/invite-user-dialog.lazy.tsx';
import { JoinApplyMangeTeamDialog } from '@/pages/$teamId/settings/team-header/join-apply-manage-team-dialog.lazy.tsx';
import { useLocalStorage } from '@/utils';

interface ISettingsUserHeaderProps extends React.ComponentPropsWithoutRef<'div'> {
  readonly?: boolean;
  buttons?: React.ReactNode;
}

export const SettingsTeamHeader: React.FC<ISettingsUserHeaderProps> = ({ readonly = false, buttons, children }) => {
  const { data: teams } = useTeams();
  const [teamId] = useLocalStorage<string>('vines-team-id', (teams ?? [])[0]?.id ?? '', false);

  const [dialogInputOptions, setDialogInputOptions] = useState<{
    type: 'name' | 'description';
    placeholder: string;
    value: string;
  } | null>(null);

  const [inviteUserDialogOpen, toggleInviteUserDialogOpen] = useState(false);
  const [inviteLinkManageDialogOpen, toggleInviteLinkManageDialogOpen] = useState(false);
  const [applyManageModelOpen, toggleApplyManageModelOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [updateLoading, toggleUploadLoading] = useState(false);

  const currentTeam = (teams ?? []).find((team) => team.id === teamId);

  const handleNameClick = useMemo(() => {
    return readonly
      ? undefined
      : () =>
          setDialogInputOptions({
            type: 'name',
            value: currentTeam?.name || '',
            placeholder: '团队名称',
          });
  }, [readonly, currentTeam]);

  const handleDescClick = useMemo(() => {
    return readonly
      ? undefined
      : () =>
          setDialogInputOptions({
            type: 'description',
            value: currentTeam?.description || '',
            placeholder: '团队描述',
          });
  }, [readonly, currentTeam]);

  const handleAvatarClick = useMemo(() => {
    return readonly ? undefined : () => {};
  }, [readonly]);

  const handleInputValue = useCallback(async () => {
    if (!dialogInputOptions) return;
    const { type, value } = dialogInputOptions;
    if (!value) {
      toast.warning('请检查输入');
      return;
    }
    setDialogInputOptions(null);
    setLoading(false);
  }, [dialogInputOptions]);

  return (
    <>
      <SettingsHeader
        avatarUrl={currentTeam?.logoUrl}
        name={currentTeam?.name}
        desc={currentTeam?.description}
        buttons={
          buttons ?? (
            <>
              <Button size="large" onClick={() => toggleApplyManageModelOpen(true)}>
                申请管理
              </Button>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="solid" size="large" icon={<ChevronDown />}>
                    邀请新用户
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent>
                  {[
                    {
                      node: 'item',
                      name: '生成邀请链接',
                      onClick: () => toggleInviteUserDialogOpen(true),
                    },
                    {
                      node: 'item',
                      name: '管理邀请链接',
                      onClick: () => toggleInviteLinkManageDialogOpen(true),
                    },
                  ].map(({ name, onClick }, index) => (
                    <DropdownMenuItem key={index} onSelect={onClick}>
                      <span>{name}</span>
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>
            </>
          )
        }
        onAvatarClick={handleAvatarClick}
        onNameClick={handleNameClick}
        onDescClick={handleDescClick}
      >
        {children}
      </SettingsHeader>
      {dialogInputOptions ? (
        <Dialog open onClose={() => setDialogInputOptions(null)}>
          <DialogContent>
            <DialogTitle>{`请输入${dialogInputOptions?.placeholder}`}</DialogTitle>
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

      {readonly ? null : (
        <>
          <JoinApplyMangeTeamDialog
            team={currentTeam}
            open={applyManageModelOpen}
            onClose={() => {
              toggleApplyManageModelOpen(false);
            }}
          />
          <InviteUserDialog
            team={currentTeam}
            open={inviteUserDialogOpen}
            onClose={() => toggleInviteUserDialogOpen(false)}
          />
          {/*<InviteLinkManageModal*/}
          {/*  visible={inviteLinkManageModalVisible}*/}
          {/*  onClose={() => toggleInviteLinkManageModalVisible(false)}*/}
          {/*/>*/}
        </>
      )}
    </>
  );
};
