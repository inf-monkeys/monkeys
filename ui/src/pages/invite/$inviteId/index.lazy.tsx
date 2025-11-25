import React, { useEffect, useState } from 'react';

import { useSWRConfig } from 'swr';
import { createLazyFileRoute, useNavigate } from '@tanstack/react-router';

import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';

import { acceptTeamInvite, useInviteTeam } from '@/apis/authz/team';
import { getVinesToken } from '@/apis/utils';
import { LoginDialog } from '@/components/layout/login/login-dialog';
import { getVinesTeamId } from '@/components/router/guard/team.tsx';
import { Button } from '@/components/ui/button';
import { Card, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card.tsx';
import { VinesLoading } from '@/components/ui/loading';
import { getI18nContent } from '@/utils';

const InvitePage: React.FC = () => {
  const { t } = useTranslation();
  const { mutate } = useSWRConfig();
  const navigate = useNavigate();
  const params = Route.useParams();
  const inviteId = (params as any).inviteId;

  const finalInviteId = inviteId?.replace('i-', '') ?? '';

  const [loading, setLoading] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(() => {
    const token = getVinesToken();
    return !!token;
  });

  // 只在已登录时才调用 API
  const { data, error } = useInviteTeam(isLoggedIn ? finalInviteId : undefined);

  // 处理已加入团队的情况
  useEffect(() => {
    if (!isLoggedIn || !data) return;

    if (data.alreadyJoined && data.teamId) {
      localStorage.setItem('vines-team-id', data.teamId);
      window['vinesTeamId'] = data.teamId;

      const teamName = getI18nContent(data.team?.name) || '';
      toast.info(t('pages.invite.already-member', { teamName }));

      void navigate({ to: '/$teamId', params: { teamId: data.teamId } });
    }
  }, [data, navigate, isLoggedIn]);

  // 处理错误
  useEffect(() => {
    if (!isLoggedIn || !error) return;

    if (error instanceof Error) {
      if (error.message.startsWith('邀请链接不存在')) {
        toast.error(t('pages.invite.error.link-not-found'));
        const teamId = getVinesTeamId();
        void navigate({ to: teamId ? '/$teamId' : '/home/', params: teamId ? { teamId } : undefined });
        return;
      }

      if (error.message.startsWith('您已加入该团队')) {
        const errorMsg = error.message;
        const teamIdMatch = errorMsg.match(/您已加入该团队，无需重复加入：(\w+)/);

        if (teamIdMatch && teamIdMatch[1]) {
          const joinedTeamId = teamIdMatch[1];
          localStorage.setItem('vines-team-id', joinedTeamId);
          window['vinesTeamId'] = joinedTeamId;

          toast.info(t('pages.invite.already-joined'));
          void navigate({ to: '/$teamId', params: { teamId: joinedTeamId } });
          return;
        } else {
          const teamId = getVinesTeamId();
          toast.warning(t('pages.invite.error.cannot-get-team-info'));
          void navigate({ to: teamId ? '/$teamId' : '/home/', params: teamId ? { teamId } : undefined });
          return;
        }
      }

      toast.error(t('pages.invite.error.fetch-failed', { message: error.message }));
      const teamId = getVinesTeamId();
      void navigate({ to: teamId ? '/$teamId' : '/home/', params: teamId ? { teamId } : undefined });
    }
  }, [error, navigate, isLoggedIn]);

  const handleJoinTeam = () => {
    setLoading(true);
    toast.promise(acceptTeamInvite(finalInviteId), {
      loading: t('pages.invite.joining'),
      success: () => {
        mutate('/api/teams').then(() => {
          const inviteTeamId = data?.team?.id ?? getVinesTeamId();
          localStorage.setItem('vines-team-id', inviteTeamId);
          window['vinesTeamId'] = inviteTeamId;
          void navigate({ to: '/$teamId', params: { teamId: inviteTeamId } });
        });
        return t('pages.invite.join-success');
      },
      error: t('pages.invite.join-failed'),
      finally: () => {
        setLoading(false);
      },
    });
  };

  const handleLoginFinished = () => {
    setIsLoggedIn(true);
  };

  // 未登录：全屏显示登录对话框
  if (!isLoggedIn) {
    return (
      <div className="vines-center size-full min-h-screen bg-background">
        <LoginDialog open={true} onOpenChange={() => {}} onLoginFinished={handleLoginFinished} hideCloseButton />
      </div>
    );
  }

  // 已登录，加载中
  if (!data && !error) {
    return (
      <div className="vines-center size-full min-h-screen bg-background">
        <Card className="min-w-[30rem]">
          <CardHeader>
            <CardTitle>{t('pages.invite.loading.title')}</CardTitle>
            <CardDescription>{t('pages.invite.loading.description')}</CardDescription>
          </CardHeader>
          <CardFooter className="vines-center flex">
            <VinesLoading />
          </CardFooter>
        </Card>
      </div>
    );
  }

  // 错误状态
  if (error) {
    return (
      <div className="vines-center size-full min-h-screen bg-background">
        <Card className="min-w-[30rem]">
          <CardHeader>
            <CardTitle>{t('pages.invite.error.title')}</CardTitle>
            <CardDescription>
              {error instanceof Error ? error.message : t('pages.invite.error.default')}
            </CardDescription>
          </CardHeader>
          <CardFooter className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => navigate({ to: '/home/' })}>
              {t('pages.invite.back-to-home')}
            </Button>
          </CardFooter>
        </Card>
      </div>
    );
  }

  // 显示邀请信息
  const teamName = getI18nContent(data?.team?.name) || '';
  const teamDescription = getI18nContent(data?.team?.description) || t('pages.invite.default-description');

  return (
    <div className="vines-center size-full min-h-screen bg-background">
      <Card className="min-w-[30rem]">
        <CardHeader>
          <CardTitle>{t('pages.invite.title', { teamName })}</CardTitle>
          <CardDescription>{teamDescription}</CardDescription>
        </CardHeader>
        <CardFooter className="flex justify-end">
          <Button variant="outline" onClick={handleJoinTeam} loading={loading}>
            {t('pages.invite.join-button')}
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
};

// @ts-ignore
export const Route = createLazyFileRoute('/invite/$inviteId/')({
  component: InvitePage,
});
