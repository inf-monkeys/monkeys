import React, { useState } from 'react';

import { useSWRConfig } from 'swr';
import { createFileRoute, useNavigate } from '@tanstack/react-router';

import { toast } from 'sonner';

import { acceptTeamInvite, useInviteTeam } from '@/apis/authz/team';
import { Button } from '@/components/ui/button';
import { Card, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card.tsx';
import { useLocalStorage } from '@/utils';

const JoinTeamPage: React.FC = () => {
  const { mutate } = useSWRConfig();
  const navigate = useNavigate();
  const [teamId] = useLocalStorage<string>('vines-team-id', '', false);
  const { teamId: inviteId } = Route.useParams();

  const [loading, setLoading] = useState(false);

  const { data, error } = useInviteTeam(inviteId);

  if (error instanceof Error) {
    if (error.message.startsWith('您已加入该团队')) {
      void navigate({ to: '/$teamId', params: { teamId } });
      return null;
    }
  }

  const handleJoinTeam = () => {
    setLoading(true);
    toast.promise(acceptTeamInvite(inviteId), {
      loading: '正在加入团队...',
      success: () => {
        mutate('/api/teams').then(() => {
          void navigate({ to: '/$teamId', params: { teamId: data?.team?.id ?? teamId } });
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

export const Route = createFileRoute('/$teamId/join-team/')({
  component: JoinTeamPage,
});
