import React, { useMemo, useState } from 'react';

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

  const teamName = team?.name || t('common.utils.team');
  const enableTeamLogo = get(team, 'customTheme.enableTeamLogo', void 0);

  useMemo(() => {
    setSelected(enableTeamLogo ? 'team' : 'system');
  }, [enableTeamLogo]);

  const handleUpdate = (val: string) => {
    setSelected(val);
    if (!team) {
      toast.error(t('common.toast.team-not-found'));
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
  const handleUpdateTeamDarkmodeLogo = (val: string) => {
    toast.promise(
      new Promise((resolve) => {
        updateTeam({
          darkmodeIconUrl: val,
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
  const teamDarkmodeLogo = team?.darkmodeIconUrl;

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t('settings.theme.team-logo.title')}</CardTitle>
        <CardDescription>{t('settings.theme.team-logo.description')}</CardDescription>
      </CardHeader>
      <CardContent className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <VinesImageEditor
            value={teamLogo}
            onChange={handleUpdateTeamLogo}
            tooltipI18nKey="settings.theme.team-logo.lightmode"
          >
            <Avatar className="size-10 rounded-md">
              <AvatarImage className="aspect-auto" src={team?.iconUrl} alt={teamName} />
              <AvatarFallback className="rounded-none p-2 text-xs">{teamName?.substring(0, 2)}</AvatarFallback>
            </Avatar>
          </VinesImageEditor>
          <VinesImageEditor
            value={teamDarkmodeLogo}
            onChange={handleUpdateTeamDarkmodeLogo}
            tooltipI18nKey="settings.theme.team-logo.darkmode"
          >
            <Avatar className="size-10 rounded-md">
              <AvatarImage className="aspect-auto" src={team?.darkmodeIconUrl} alt={teamName} />
              <AvatarFallback className="rounded-none p-2 text-xs">{teamName?.substring(0, 2)}</AvatarFallback>
            </Avatar>
          </VinesImageEditor>
        </div>
        <Tabs value={selected} onValueChange={handleUpdate}>
          <TabsList>
            <TabsTrigger value="team">{t('settings.theme.team-logo.options.team')}</TabsTrigger>
            <TabsTrigger value="system">{t('settings.theme.team-logo.options.system')}</TabsTrigger>
          </TabsList>
        </Tabs>
      </CardContent>
    </Card>
  );
};
