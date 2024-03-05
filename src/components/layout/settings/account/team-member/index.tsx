import React from 'react';

import { ScrollShadow } from '@nextui-org/scroll-shadow';
import { Trash2 } from 'lucide-react';
import { toast } from 'sonner';

import { removeTeamMember, useTeamUsers } from '@/apis/authz/team';
import { IVinesUser } from '@/apis/authz/user/typings.ts';
import { Invite } from '@/components/layout/settings/account/team-member/invite';
import { useVinesTeam } from '@/components/router/guard/team.tsx';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar.tsx';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card.tsx';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { useLocalStorage } from '@/utils';
import { maskEmail, maskPhone } from '@/utils/maskdata.ts';

interface ITeamMemberProps extends React.ComponentPropsWithoutRef<'div'> {}

export const TeamMember: React.FC<ITeamMemberProps> = () => {
  const [user] = useLocalStorage<Partial<IVinesUser>>('vines-account', {});
  const { team, isTeamOwner } = useVinesTeam();
  const { data, mutate } = useTeamUsers(team?._id);

  const handleRemoveTeamMember = (userId: string) => {
    if (team) {
      toast('确认删除吗？该操作不可撤销', {
        action: {
          label: '确认',
          onClick: () => {
            toast.promise(removeTeamMember(team._id, userId), {
              success: () => {
                void mutate();
                return '删除成功';
              },
              loading: '正在删除中',
              error: '删除失败',
            });
          },
        },
      });
    }
  };

  const currentUserId = user.id ?? '';
  const isOwner = isTeamOwner(currentUserId);

  const finalMember = data?.list?.sort((a) => (a._id === currentUserId ? -1 : 1)) ?? [];

  return (
    <Card>
      <CardHeader className="relative">
        <CardTitle>团队成员</CardTitle>
        <CardDescription>{isOwner ? '邀请您的团队成员进行协作' : '与团队成员进行协作'}</CardDescription>
        <div className="absolute left-0 top-0 !mt-0 flex size-full items-center justify-end gap-2 p-6">
          <Invite />
        </div>
      </CardHeader>
      <ScrollShadow className="max-h-64">
        <CardContent className="grid gap-4">
          {finalMember.map(({ _id, name, photo, phone, email }) => (
            <div className="flex items-center gap-4" key={_id}>
              <Avatar className="size-10">
                <AvatarImage className="aspect-auto" src={photo} alt={name} />
                <AvatarFallback className="rounded-none p-2 text-xs">{name.substring(0, 2)}</AvatarFallback>
              </Avatar>
              <div className="flex flex-col justify-center">
                <h3 className="line-clamp-1 font-semibold leading-tight">{name}</h3>
                <p className="line-clamp-1 text-xs"> {phone ? maskPhone(phone) : maskEmail(email ?? '')}</p>
              </div>
              {_id !== currentUserId && isOwner && (
                <div className="flex h-8 flex-1 justify-end">
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        size="small"
                        theme="danger"
                        icon={<Trash2 />}
                        onClick={() => handleRemoveTeamMember(_id)}
                      />
                    </TooltipTrigger>
                    <TooltipContent>删除用户</TooltipContent>
                  </Tooltip>
                </div>
              )}
            </div>
          ))}
        </CardContent>
      </ScrollShadow>
    </Card>
  );
};
