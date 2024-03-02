import React from 'react';

import { useSWRConfig } from 'swr';

import { Pencil } from 'lucide-react';
import { toast } from 'sonner';

import { updateTeam } from '@/apis/authz/team';
import { ITeamUpdate } from '@/apis/authz/team/typings.ts';
import { InfoEditor } from '@/components/layout/settings/account/info-editor.tsx';
import { useVinesTeam } from '@/components/router/guard/team.tsx';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar.tsx';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card.tsx';

interface ITeamProps extends React.ComponentPropsWithoutRef<'div'> {}

export const Team: React.FC<ITeamProps> = () => {
  const { mutate } = useSWRConfig();
  const { team } = useVinesTeam();

  const handleUpdateTeam = (key: string, val: string) => {
    toast.promise(
      new Promise(async (resolve) => {
        await updateTeam({
          [key]: val,
        } as unknown as ITeamUpdate);
        await mutate('/api/teams');
        resolve('');
      }),
      {
        loading: '更新中...',
        success: '更新成功！',
        error: '更新失败！请稍后再重试',
      },
    );
  };

  const teamName = team?.name || '团队';
  const teamDescription = team?.description || '暂无描述';

  return (
    <Card>
      <CardHeader>
        <CardTitle>我的团队</CardTitle>
        <CardDescription>管理您的团队数据</CardDescription>
      </CardHeader>
      <CardContent className="flex gap-4">
        <Avatar className="size-10">
          <AvatarImage className="aspect-auto" src={team?.logoUrl} alt={teamName} />
          <AvatarFallback className="rounded-none p-2 text-xs">{teamName.substring(0, 2)}</AvatarFallback>
        </Avatar>
        <div className="flex flex-col justify-center">
          <InfoEditor
            title="编辑团队名称"
            placeholder="输入昵称，16 字以内"
            initialValue={teamName}
            onFinished={(val) => handleUpdateTeam('name', val)}
          >
            <div className="group flex cursor-pointer items-center gap-2 transition-opacity hover:opacity-75">
              <h3 className="line-clamp-1 font-semibold leading-tight">{teamName}</h3>
              <Pencil size={16} className="-mb-0.5 opacity-0 transition-opacity group-hover:opacity-100" />
            </div>
          </InfoEditor>
          <InfoEditor
            title="编辑团队描述"
            placeholder="输入描述，16 字以内"
            initialValue={teamDescription}
            onFinished={(val) => handleUpdateTeam('description', val)}
          >
            <div className="group flex cursor-pointer items-center gap-2 transition-opacity hover:opacity-75">
              <h3 className="line-clamp-1 text-xs">{teamDescription}</h3>
              <Pencil size={12} className="opacity-0 transition-opacity group-hover:opacity-100" />
            </div>
          </InfoEditor>
        </div>
      </CardContent>
    </Card>
  );
};
