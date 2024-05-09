import React, { useEffect, useState } from 'react';

import { useSWRConfig } from 'swr';

import { get, set } from 'lodash';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';

import { updateTeam } from '@/apis/authz/team';
import { ITeamUpdate } from '@/apis/authz/team/typings.ts';
import { useVinesTeam } from '@/components/router/guard/team.tsx';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar.tsx';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card.tsx';
import { VinesImageEditor } from '@/components/ui/image-editor';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs.tsx';

interface ITeamLogoProps extends React.ComponentPropsWithoutRef<'div'> {}

export const TeamLogo: React.FC<ITeamLogoProps> = () => {
  const { t } = useTranslation();

  const { mutate } = useSWRConfig();
  const { team } = useVinesTeam();

  const [selected, setSelected] = useState<string>('');

  const teamName = team?.name || '团队';
  const enableTeamLogo = get(team, 'customTheme.enableTeamLogo', void 0);

  useEffect(() => {
    if (!selected && enableTeamLogo !== void 0) {
      setSelected(enableTeamLogo ? 'team' : 'system');
    }
  }, [enableTeamLogo]);

  const handleUpdate = (val: string) => {
    setSelected(val);
    if (!team) {
      toast.error('团队不存在');
      return;
    }
    set(team, 'customTheme.enableTeamLogo', val === 'team');
    toast.promise(updateTeam({ customTheme: team.customTheme }), {
      loading: t('common.update.loading'),
      success: () => {
        void mutate('/api/teams');
        return t('common.update.success');
      },
      error: t('common.update.error'),
    });
  };

  const handleUpdateTeamLogo = (val: string) => {
    toast.promise(
      new Promise((resolve) => {
        updateTeam({
          iconUrl: val,
        } as unknown as ITeamUpdate).then(async () => {
          await mutate('/api/teams');
          resolve('');
        });
      }),
      {
        loading: t('common.update.loading'),
        success: t('common.update.success'),
        error: t('common.update.error'),
      },
    );
  };

  const teamLogo = team?.iconUrl;

  return (
    <Card>
      <CardHeader>
        <CardTitle>系统图标</CardTitle>
        <CardDescription>你可以在这里设置团队的系统图标</CardDescription>
      </CardHeader>
      <CardContent className="flex items-center justify-between">
        <VinesImageEditor value={teamLogo} onChange={handleUpdateTeamLogo}>
          <Avatar className="size-10 cursor-pointer">
            <AvatarImage className="aspect-auto" src={team?.iconUrl} alt={teamName} />
            <AvatarFallback className="rounded-none p-2 text-xs">{teamName.substring(0, 2)}</AvatarFallback>
          </Avatar>
        </VinesImageEditor>
        <Tabs value={selected} onValueChange={handleUpdate}>
          <TabsList>
            <TabsTrigger value="team">团队图标</TabsTrigger>
            <TabsTrigger value="system">系统预置</TabsTrigger>
          </TabsList>
        </Tabs>
      </CardContent>
    </Card>
  );
};
