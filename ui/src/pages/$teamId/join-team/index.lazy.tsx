import React, { useState } from 'react';

import { useSWRConfig } from 'swr';
import { createLazyFileRoute, useNavigate } from '@tanstack/react-router';

import { toast } from 'sonner';

import { acceptTeamInvite, useInviteTeam } from '@/apis/authz/team';
import { useVinesTeam } from '@/components/router/guard/team.tsx';
import { Button } from '@/components/ui/button';
import { Card, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card.tsx';

const JoinTeamPage: React.FC = () => {
  const { mutate } = useSWRConfig();
  const navigate = useNavigate();
  const { teamId } = useVinesTeam();
  const { teamId: inviteId } = Route.useParams();

  const finalInviteId = inviteId?.replace('i-', '') ?? '';

  const [loading, setLoading] = useState(false);

  const { data, error } = useInviteTeam(finalInviteId);

  // 处理已加入团队的情况
  if (data?.alreadyJoined && data?.teamId) {
    // 如果用户已加入团队，自动重定向到对应团队页面
    localStorage.setItem('vines-team-id', data.teamId);
    window['vinesTeamId'] = data.teamId;

    // 显示已加入团队的提示
    toast.info(`您已是「${data.team?.name || ''}」团队成员，正在跳转到团队页面...`);

    // 重定向到团队页面
    void navigate({ to: '/$teamId', params: { teamId: data.teamId } });
    return null;
  }

  if (error instanceof Error) {
    if (error.message.startsWith('邀请链接不存在')) {
      toast.error('邀请链接不存在或已过期');
      void navigate({ to: '/$teamId', params: { teamId } });
      return null;
    }

    // 处理"已加入团队"的错误 - 这部分代码可能不再需要，因为我们已经在后端修改了响应格式
    // 但为了兼容性，我们保留这部分代码
    if (error.message.startsWith('您已加入该团队')) {
      // 从错误消息中提取团队ID
      const errorMsg = error.message;
      const teamIdMatch = errorMsg.match(/您已加入该团队，无需重复加入：(\w+)/);

      if (teamIdMatch && teamIdMatch[1]) {
        const joinedTeamId = teamIdMatch[1];
        // 更新本地存储和全局变量
        localStorage.setItem('vines-team-id', joinedTeamId);
        window['vinesTeamId'] = joinedTeamId;

        // 显示提示
        toast.info('您已是该团队成员，正在跳转到团队页面...');

        // 重定向到对应团队页面
        void navigate({ to: '/$teamId', params: { teamId: joinedTeamId } });
        return null;
      } else {
        // 如果无法提取团队ID，回退到当前团队
        toast.warning('无法获取团队信息，正在返回当前团队');
        void navigate({ to: '/$teamId', params: { teamId } });
        return null;
      }
    }

    // 处理其他错误
    toast.error(`获取团队邀请信息失败: ${error.message}`);
    void navigate({ to: '/$teamId', params: { teamId } });
    return null;
  }

  const handleJoinTeam = () => {
    setLoading(true);
    toast.promise(acceptTeamInvite(finalInviteId), {
      loading: '正在加入团队...',
      success: () => {
        mutate('/api/teams').then(() => {
          const inviteTeamId = data?.team?.id ?? teamId;
          localStorage.setItem('vines-team-id', inviteTeamId);
          window['vinesTeamId'] = inviteTeamId;
          void navigate({ to: '/$teamId', params: { teamId: inviteTeamId } });
        });
        return '成功加入团队';
      },
      error: '加入团队失败',
      finally: () => {
        setLoading(false);
      },
    });
  };

  return (
    <main className="vines-center size-full">
      <Card className="min-w-[30rem]">
        <CardHeader>
          <CardTitle>「{data?.team?.name}」邀请您加入团队</CardTitle>
          <CardDescription>{data?.team?.description}</CardDescription>
        </CardHeader>
        <CardFooter className="flex justify-end">
          <Button variant="outline" onClick={handleJoinTeam} loading={loading}>
            立即加入团队
          </Button>
        </CardFooter>
      </Card>
    </main>
  );
};

export const Route = createLazyFileRoute('/$teamId/join-team/')({
  component: JoinTeamPage,
});
