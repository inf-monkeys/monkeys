import React, { useState } from 'react';

import { MoreHorizontal, Pause, Pencil, Play } from 'lucide-react';
import moment from 'moment';

import { useGetTeamInvites } from '@/apis/authz/team';
import { ITeam, TeamInviteStatus, TeamInviteWithUserProfile } from '@/apis/authz/team/typings.ts';
import { IVinesUser } from '@/apis/authz/user/typings.ts';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar.tsx';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogFooter, DialogTitle } from '@/components/ui/dialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu.tsx';
import { Input } from '@/components/ui/input.tsx';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table.tsx';
import { Tooltip } from '@/components/ui/tooltip';

interface Props {
  open: boolean;
  onClose: () => void;
  team?: ITeam;
}

const AvatarWithProfile: React.FC<{ user: Partial<IVinesUser> }> = ({ user }) => {
  return (
    <Tooltip content={user?.name ?? 'AI'}>
      <Avatar className="size-7">
        <AvatarImage className="aspect-auto" src={user?.photo ?? ''} alt={user?.name ?? 'AI'} />
        <AvatarFallback className="rounded-none p-2 text-xs">{(user?.name ?? 'AI').substring(0, 2)}</AvatarFallback>
      </Avatar>
    </Tooltip>
  );
};

export const InviteLinkManageDialog: React.FC<Props> = ({ open, onClose, team }) => {
  const [remark, setRemark] = useState('');
  const [currentLink, setCurrentLink] = useState<TeamInviteWithUserProfile>();
  const [remarkModalVisible, toggleRemarkModalVisible] = useState(false);

  const { data: invites, mutate } = useGetTeamInvites(team?._id ?? '');

  async function handlePauseLink(link: TeamInviteWithUserProfile) {
    if (team) {
      // toast.promise(
      //   toggleTeamInviteStatus(team._id, link._id).then((v) => {
      //     mutate();
      //     return v;
      //   }),
      //   {
      //     success: '操作成功',
      //     loading: '操作中......',
      //     error: '操作失败',
      //   },
      // );
    }
  }

  async function handleEditRemark(link: TeamInviteWithUserProfile) {
    if (team) {
      // toast.promise(
      //   updateTeamInviteRemark(team._id, link._id, remark).then((v) => {
      //     mutate();
      //     return v;
      //   }),
      //   {
      //     success: '操作成功',
      //     loading: '操作中......',
      //     error: '操作失败',
      //   },
      // );
    }
    toggleRemarkModalVisible(false);
  }

  async function handleDeleteLink(link: TeamInviteWithUserProfile) {
    if (team) {
      // toast.promise(
      //   deleteTeamInvite(team._id, link._id).then((v) => {
      //     mutate();
      //     return v;
      //   }),
      //   {
      //     success: '操作成功',
      //     loading: '操作中......',
      //     error: '操作失败',
      //   },
      // );
    }
  }

  return (
    <>
      <Dialog open={remarkModalVisible} onClose={() => toggleRemarkModalVisible(false)}>
        <DialogContent>
          <DialogTitle>请输入备注</DialogTitle>
          <Input placeholder="16 字内，仅内部可见" maxLength={16} value={remark} onChange={setRemark} />
          <DialogFooter>
            <Button onClick={() => toggleRemarkModalVisible(false)}>取消</Button>
            <Button variant="solid" onClick={() => handleEditRemark(currentLink!)}>
              保存
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      <Dialog open={open} onClose={onClose}>
        <DialogContent className="!h-[600px] !max-w-[1200px]">
          <DialogTitle>邀请链接管理</DialogTitle>
          <Table className="overflow-y-scroll">
            <TableHeader>
              <TableRow>
                <TableHead className="text-nowrap">状态</TableHead>
                <TableHead className="text-nowrap">备注</TableHead>
                <TableHead className="text-nowrap">失效时间</TableHead>
                <TableHead className="text-nowrap">创建者</TableHead>
                <TableHead className="text-nowrap">邀请用户</TableHead>
                <TableHead className="text-nowrap">接受邀请用户</TableHead>
                <TableHead className="text-nowrap">操作</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {(invites ?? []).map((invite) => (
                <TableRow key={invite._id}>
                  <TableCell>
                    {invite.status === TeamInviteStatus.DISABLED ? <Pause size={16} /> : <Play size={16} />}
                  </TableCell>
                  <TableCell className="flex max-w-32 items-center gap-2 overflow-x-auto text-nowrap py-3">
                    {invite.remark ? <span>{invite.remark}</span> : null}{' '}
                    <Pencil
                      size={16}
                      onClick={() => {
                        setRemark(invite.remark || '');
                        setCurrentLink(invite);
                        toggleRemarkModalVisible(true);
                      }}
                      className="cursor-pointer"
                    />
                  </TableCell>
                  <TableCell>
                    {invite.outdateTimestamp
                      ? moment(invite.outdateTimestamp).format('YYYY-MM-DD HH:mm:ss')
                      : '永久有效'}
                  </TableCell>
                  <TableCell>
                    <AvatarWithProfile user={invite.inviterUser!} />
                  </TableCell>
                  <TableCell>
                    {invite.targetUserId ? <AvatarWithProfile user={invite.targetUser!} /> : '所有人'}
                  </TableCell>
                  <TableCell>
                    {invite.acceptedUsers?.length ? (
                      <div className="flex items-center">
                        {invite.acceptedUsers.slice(0, 4).map((u, index) => (
                          <AvatarWithProfile key={index} user={u} />
                        ))}
                        {invite.acceptedUsers.length > 4 && <span>+{invite.acceptedUsers.length - 4}</span>}
                      </div>
                    ) : (
                      '-'
                    )}
                  </TableCell>
                  <TableCell>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <MoreHorizontal />
                      </DropdownMenuTrigger>
                      <DropdownMenuContent>
                        {[
                          {
                            name: invite.status !== TeamInviteStatus.DISABLED ? '关闭' : '开启',
                            onClick: () => handlePauseLink(invite),
                          },
                          {
                            name: '删除',
                            onClick: () => handleDeleteLink(invite),
                          },
                        ].map(({ name, onClick }, index) => (
                          <DropdownMenuItem key={index} onSelect={onClick}>
                            <span>{name}</span>
                          </DropdownMenuItem>
                        ))}
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </DialogContent>
      </Dialog>
    </>
  );
};
