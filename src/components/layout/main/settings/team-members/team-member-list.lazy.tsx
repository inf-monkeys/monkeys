import React, { useCallback, useMemo } from 'react';

import { Trash } from 'lucide-react';
import { toast } from 'sonner';

import { useGetTeamUsers, useRemoveTeamMember } from '@/apis/authz/team';
import { ITeam } from '@/apis/authz/team/typings.ts';
import { IUser } from '@/components/router/guard/auth.ts';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar.tsx';
import { Button } from '@/components/ui/button';

interface ITeamMemberListProps extends React.ComponentPropsWithoutRef<'div'> {
  user?: Partial<IUser>;
  currentTeam?: ITeam;
}

export const TeamMemberList: React.FC<ITeamMemberListProps> = ({ user, currentTeam }) => {
  const { data: teamMembersResp, mutate } = useGetTeamUsers(currentTeam?._id ?? '');
  const teamMembers = useMemo(() => teamMembersResp?.list ?? [], [teamMembersResp]);
  const { trigger } = useRemoveTeamMember(currentTeam?._id ?? '');
  const handleRemoveTeamMember = useCallback(
    (userId: string) => {
      if (currentTeam) {
        toast('确认删除吗？该操作不可撤销', {
          action: {
            label: '确认',
            onClick: () => {
              toast.promise(
                trigger({
                  userId,
                }).then(() => {
                  void mutate();
                }),
                {
                  success: '操作成功',
                  loading: '操作中......',
                  error: '操作失败',
                },
              );
            },
          },
        });
      }
    },
    [currentTeam],
  );

  return (
    <>
      {(teamMembers ?? []).map((member, i) => {
        const { _id: memberUserId, photo } = member;
        const currentUserId = user?._id;

        return (
          <div className={`flex h-16 w-full items-center justify-between text-xs`} key={memberUserId}>
            <div className="flex items-center gap-2">
              <Avatar className="size-7">
                <AvatarImage className="aspect-auto" src={photo} alt={member.name} />
                <AvatarFallback className="rounded-none p-2 text-xs">
                  {(member.name ?? 'AI').substring(0, 2)}
                </AvatarFallback>
              </Avatar>
              <div className="ml-1 font-bold">{member.name}</div>
              {currentUserId === memberUserId ? (
                <div className="scale-75 rounded-md bg-[var(--semi-color-primary)] bg-vines-400 bg-opacity-50 p-1.5 leading-none">
                  我
                </div>
              ) : null}
            </div>

            <div className="flex">
              {currentTeam?.ownerUserId === currentUserId && currentUserId !== memberUserId ? (
                <Button
                  theme="danger"
                  icon={<Trash size={16} />}
                  onClick={() => handleRemoveTeamMember(memberUserId)}
                />
              ) : null}
            </div>
          </div>
        );
      })}
    </>
  );
};
