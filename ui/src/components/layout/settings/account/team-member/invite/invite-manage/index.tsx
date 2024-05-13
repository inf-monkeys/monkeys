import React from 'react';

import { ColumnDef } from '@tanstack/react-table';
import dayjs from 'dayjs';
import { MoreHorizontal, Pause, Pencil, Play, Settings } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';

import { deleteTeamInvite, toggleTeamInviteStatus, updateTeamInviteRemark, useTeamInvites } from '@/apis/authz/team';
import { ITeamInviteStatus, ITeamInviteWithUserProfile } from '@/apis/authz/team/typings.ts';
import { IVinesUser } from '@/apis/authz/user/typings.ts';
import { InfoEditor } from '@/components/layout/settings/account/info-editor.tsx';
import { useVinesTeam } from '@/components/router/guard/team.tsx';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar.tsx';
import { DataTable } from '@/components/ui/data-table';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
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
import { Spinner } from '@/components/ui/spinner';
import { Tooltip } from '@/components/ui/tooltip';

interface IInviteManageProps extends React.ComponentPropsWithoutRef<'div'> {
  visible: boolean;
  setVisible: (visible: boolean) => void;
}

export const InviteManage: React.FC<IInviteManageProps> = ({ visible, setVisible }) => {
  const { t } = useTranslation();
  const { team } = useVinesTeam();
  const { data: inviteList, isLoading, mutate: mutateInviteList } = useTeamInvites(team?.id);

  const handleEditRemark = (inviteId: string, remark: string) => {
    if (inviteId && team && team.id) {
      toast.promise(updateTeamInviteRemark(team.id, inviteId, remark), {
        success: () => {
          void mutateInviteList();
          return t('common.update.success');
        },
        loading: t('common.update.loading'),
        error: t('common.update.error'),
      });
    } else {
      toast.warning(t('common.toast.loading'));
    }
  };

  const handleToggleLinkPause = async (inviteId: string) => {
    if (inviteId && team && team.id) {
      toast.promise(toggleTeamInviteStatus(team.id, inviteId), {
        success: () => {
          mutateInviteList();
          return t('common.operate.success');
        },
        loading: t('common.operate.loading'),
        error: t('common.operate.error'),
      });
    } else {
      toast.warning(t('common.toast.loading'));
    }
  };

  const handleDeleteLink = async (inviteId: string) => {
    if (inviteId && team && team.id) {
      toast(t('common.delete.confirm-content'), {
        action: {
          label: t('common.utils.confirm'),
          onClick: () => {
            toast.promise(deleteTeamInvite(team.id, inviteId), {
              success: () => {
                mutateInviteList();
                return t('common.delete.success');
              },
              loading: t('common.delete.loading'),
              error: t('common.delete.error'),
            });
          },
        },
      });
    } else {
      toast.warning(t('common.toast.loading'));
    }
  };

  const column: ColumnDef<ITeamInviteWithUserProfile>[] = [
    {
      accessorKey: 'status',
      header: t('settings.account.team-member.invite.invite-manage.column.status.label'),
      size: 60,
      cell: ({ cell }) => (cell.getValue() === ITeamInviteStatus.DISABLED ? <Pause size={15} /> : <Play size={15} />),
    },
    {
      accessorKey: 'remark',
      header: t('settings.account.team-member.invite.invite-manage.column.remark.label'),
      minSize: 60,
      maxSize: 200,
      cell: ({ cell, row }) => (
        <InfoEditor
          title={t('settings.account.team-member.invite.invite-manage.column.remark.info-editor.title')}
          placeholder={t('settings.account.team-member.invite.invite-manage.column.remark.info-editor.placeholder')}
          initialValue={cell.getValue() as string}
          onFinished={(val) => handleEditRemark(row.original.id, val)}
        >
          <div className="group flex cursor-pointer items-center gap-2 transition-opacity hover:opacity-75">
            <span>{cell.getValue() as string}</span>
            <Pencil size={13} className="-mb-0.5 opacity-0 transition-opacity group-hover:opacity-100" />
          </div>
        </InfoEditor>
      ),
    },
    {
      accessorKey: 'outdateTimestamp',
      header: t('settings.account.team-member.invite.invite-manage.column.outdateTimestamp.label'),
      size: 200,
      cell: ({ cell }) =>
        cell.getValue()
          ? dayjs(cell.getValue() as number).format('YYYY-MM-DD HH:mm:ss')
          : t('settings.account.team-member.invite.outdated-options.never'),
    },
    {
      accessorKey: 'inviterUser',
      header: t('settings.account.team-member.invite.invite-manage.column.inviterUser.label'),
      cell: ({ cell }) => {
        const user = cell.getValue() as IVinesUser | undefined;
        return user ? (
          <Tooltip content={user.phone || user.email || t('common.utils.unknown')}>
            <Avatar className="size-7">
              <AvatarImage
                className="aspect-auto"
                src={user.photo}
                alt={user.phone || user.email || t('common.utils.unknown')}
              />
              <AvatarFallback className="rounded-none p-2 text-xs">
                {(user.phone || user.email || t('common.utils.unknown')).substring(0, 2)}
              </AvatarFallback>
            </Avatar>
          </Tooltip>
        ) : (
          <>-</>
        );
      },
    },
    {
      accessorKey: 'targetUser',
      header: t('settings.account.team-member.invite.invite-manage.column.targetUser.label'),
      cell: ({ cell }) => {
        const user = cell.getValue() as IVinesUser | undefined;
        return user ? (
          <Tooltip content={user.phone || user.email || t('common.utils.unknown')}>
            <Avatar className="size-7">
              <AvatarImage
                className="aspect-auto"
                src={user.photo}
                alt={user.phone || user.email || t('common.utils.unknown')}
              />
              <AvatarFallback className="rounded-none p-2 text-xs">
                {(user.phone || user.email || t('common.utils.unknown')).substring(0, 2)}
              </AvatarFallback>
            </Avatar>
          </Tooltip>
        ) : (
          <>-</>
        );
      },
    },
    {
      accessorKey: 'acceptedUsers',
      header: t('settings.account.team-member.invite.invite-manage.column.acceptedUsers.label'),
      cell: ({ cell }) => {
        const userList = (cell.getValue() ?? []) as IVinesUser[];
        return userList.length != 0 ? (
          <div className="flex gap-1">
            {userList.map((user, index) => (
              <Tooltip key={index} content={user.phone || user.email || t('common.utils.unknown')}>
                <Avatar className="size-7">
                  <AvatarImage
                    className="aspect-auto"
                    src={user.photo}
                    alt={user.phone || user.email || t('common.utils.unknown')}
                  />
                  <AvatarFallback className="rounded-none p-2 text-xs">
                    {(user.phone || user.email || t('common.utils.unknown')).substring(0, 2)}
                  </AvatarFallback>
                </Avatar>
              </Tooltip>
            ))}
          </div>
        ) : (
          <>-</>
        );
      },
    },
    {
      id: 'operate',
      header: t('settings.account.team-member.invite.invite-manage.column.operate.label'),
      size: 60,
      cell: ({ row }) => {
        return (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <MoreHorizontal size={15} className="cursor-pointer opacity-100 transition-opacity hover:opacity-50" />
            </DropdownMenuTrigger>
            <DropdownMenuContent>
              <DropdownMenuLabel>
                {t('settings.account.team-member.invite.invite-manage.column.operate.dropdown-label')}
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuGroup>
                <DropdownMenuItem
                  onSelect={() => handleToggleLinkPause(row.original.id)}
                  disabled={Boolean(row.original.outdateTimestamp)}
                >
                  <DropdownMenuShortcut className="ml-0 mr-2 mt-0.5">
                    {row.original.status === ITeamInviteStatus.DISABLED ? <Play size={15} /> : <Pause size={15} />}
                  </DropdownMenuShortcut>
                  {row.original.status === ITeamInviteStatus.DISABLED
                    ? t('common.utils.enable')
                    : t('common.utils.disable')}
                </DropdownMenuItem>
                <DropdownMenuItem onSelect={() => handleDeleteLink(row.original.id)}>
                  <DropdownMenuShortcut className="ml-0 mr-2 mt-0.5">
                    <Settings size={15} />
                  </DropdownMenuShortcut>
                  {t('common.utils.delete')}
                </DropdownMenuItem>
              </DropdownMenuGroup>
            </DropdownMenuContent>
          </DropdownMenu>
        );
      },
    },
  ];

  return (
    <Dialog open={visible} onOpenChange={setVisible}>
      <DialogContent className="max-w-[800px]">
        <DialogHeader>
          <DialogTitle>{t('settings.account.team-member.invite.invite-manage.title')}</DialogTitle>
        </DialogHeader>
        {isLoading ? (
          <Spinner loading={isLoading} />
        ) : (
          <DataTable<ITeamInviteWithUserProfile, unknown> columns={column} data={inviteList ?? []} />
        )}
      </DialogContent>
    </Dialog>
  );
};
