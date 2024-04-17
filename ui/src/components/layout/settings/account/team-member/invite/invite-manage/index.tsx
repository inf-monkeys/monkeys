import React from 'react';

import { ColumnDef } from '@tanstack/react-table';
import dayjs from 'dayjs';
import { MoreHorizontal, Pause, Pencil, Play, Settings } from 'lucide-react';
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
  const { team } = useVinesTeam();
  const { data: inviteList, isLoading, mutate: mutateInviteList } = useTeamInvites(team?.id);

  const handleEditRemark = (inviteId: string, remark: string) => {
    if (inviteId && team && team.id) {
      toast.promise(updateTeamInviteRemark(team.id, inviteId, remark), {
        success: () => {
          void mutateInviteList();
          return '更新备注成功';
        },
        loading: '更新中......',
        error: '更新失败，请检查网络后重试',
      });
    } else {
      toast.warning('读取信息失败，请刷新页面重试');
    }
  };

  const handleToggleLinkPause = async (inviteId: string) => {
    if (inviteId && team && team.id) {
      toast.promise(toggleTeamInviteStatus(team.id, inviteId), {
        success: () => {
          mutateInviteList();
          return '操作成功';
        },
        loading: '操作中......',
        error: '操作失败，请检查网络状况后重试',
      });
    } else {
      toast.warning('读取信息失败，请刷新页面重试');
    }
  };

  const handleDeleteLink = async (inviteId: string) => {
    if (inviteId && team && team.id) {
      toast(`确定要删除吗？该操作不可恢复。`, {
        action: {
          label: '确定',
          onClick: () => {
            toast.promise(deleteTeamInvite(team.id, inviteId), {
              success: () => {
                mutateInviteList();
                return '删除成功';
              },
              loading: '删除中......',
              error: '删除失败，请检查网络状况后重试',
            });
          },
        },
      });
    } else {
      toast.warning('读取信息失败，请刷新页面重试');
    }
  };

  const column: ColumnDef<ITeamInviteWithUserProfile>[] = [
    {
      accessorKey: 'status',
      header: '状态',
      size: 60,
      cell: ({ cell }) => (cell.getValue() === ITeamInviteStatus.DISABLED ? <Pause size={15} /> : <Play size={15} />),
    },
    {
      accessorKey: 'remark',
      header: '备注',
      minSize: 60,
      maxSize: 200,
      cell: ({ cell, row }) => (
        <InfoEditor
          title="编辑备注"
          placeholder="请输入备注"
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
      header: '失效时间',
      size: 200,
      cell: ({ cell }) =>
        cell.getValue() ? dayjs(cell.getValue() as number).format('YYYY-MM-DD HH:mm:ss') : '永久有效',
    },
    {
      accessorKey: 'inviterUser',
      header: '创建者',
      cell: ({ cell }) => {
        const user = cell.getValue() as IVinesUser | undefined;
        return user ? (
          <Tooltip content={user.phone || user.email || '未知'}>
            <Avatar className="size-7">
              <AvatarImage className="aspect-auto" src={user.photo} alt={user.phone || user.email || '未知'} />
              <AvatarFallback className="rounded-none p-2 text-xs">
                {(user.phone || user.email || '未知').substring(0, 2)}
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
      header: '邀请用户',
      cell: ({ cell }) => {
        const user = cell.getValue() as IVinesUser | undefined;
        return user ? (
          <Tooltip content={user.phone || user.email || '未知'}>
            <Avatar className="size-7">
              <AvatarImage className="aspect-auto" src={user.photo} alt={user.phone || user.email || '未知'} />
              <AvatarFallback className="rounded-none p-2 text-xs">
                {(user.phone || user.email || '未知').substring(0, 2)}
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
      header: '接受邀请用户',
      cell: ({ cell }) => {
        const userList = (cell.getValue() ?? []) as IVinesUser[];
        return userList.length != 0 ? (
          <div className="flex gap-1">
            {userList.map((user, index) => (
              <Tooltip key={index} content={user.phone || user.email || '未知'}>
                <Avatar className="size-7">
                  <AvatarImage className="aspect-auto" src={user.photo} alt={user.phone || user.email || '未知'} />
                  <AvatarFallback className="rounded-none p-2 text-xs">
                    {(user.phone || user.email || '未知').substring(0, 2)}
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
      header: '操作',
      size: 60,
      cell: ({ row }) => {
        return (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <MoreHorizontal size={15} className="cursor-pointer opacity-100 transition-opacity hover:opacity-50" />
            </DropdownMenuTrigger>
            <DropdownMenuContent>
              <DropdownMenuLabel>邀请链接操作</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuGroup>
                <DropdownMenuItem
                  onSelect={() => handleToggleLinkPause(row.original.id)}
                  disabled={Boolean(row.original.outdateTimestamp)}
                >
                  <DropdownMenuShortcut className="ml-0 mr-2 mt-0.5">
                    {row.original.status === ITeamInviteStatus.DISABLED ? <Play size={15} /> : <Pause size={15} />}
                  </DropdownMenuShortcut>
                  {row.original.status === ITeamInviteStatus.DISABLED ? '启用' : '禁用'}
                </DropdownMenuItem>
                <DropdownMenuItem onSelect={() => handleDeleteLink(row.original.id)}>
                  <DropdownMenuShortcut className="ml-0 mr-2 mt-0.5">
                    <Settings size={15} />
                  </DropdownMenuShortcut>
                  删除
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
          <DialogTitle>邀请链接管理</DialogTitle>
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
