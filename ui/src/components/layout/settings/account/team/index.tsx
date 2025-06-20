import React from 'react';

import { useSWRConfig } from 'swr';

import { Pencil } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';

import { updateTeam } from '@/apis/authz/team';
import { ITeamUpdate } from '@/apis/authz/team/typings.ts';
import { ApplyManage } from '@/components/layout/settings/account/team/apply-manage';
import { CreateTeam } from '@/components/layout/settings/account/team/create';
import { DeleteTeam } from '@/components/layout/settings/account/team/delete';
import { ImportExportTeam } from '@/components/layout/settings/account/team/import-export';
import { JoinPublicTeam } from '@/components/layout/settings/account/team/join-public-team';
import { useVinesTeam } from '@/components/router/guard/team.tsx';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar.tsx';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card.tsx';
import { VinesImageEditor } from '@/components/ui/image-editor';
import { SimpleDisplayNameDialog } from '@/components/ui/input/simple-display-name-dialog';
import { cn, useGetDisplayTextFromPlainTextJson } from '@/utils';

interface ITeamProps extends React.ComponentPropsWithoutRef<'div'> {}

export const Team: React.FC<ITeamProps> = () => {
  const { t } = useTranslation();

  const { mutate } = useSWRConfig();
  const { team } = useVinesTeam();
  // const [user] = useLocalStorage<Partial<IVinesUser>>('vines-account', {});

  const handleUpdateTeam = (key: string, val: string) => {
    toast.promise(
      new Promise((resolve) => {
        updateTeam({
          [key]: val,
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

  const isOwner = true; // user?.id === team?.ownerUserId
  const teamName = team?.name;
  const teamDisplayName = useGetDisplayTextFromPlainTextJson(teamName || '');
  const teamDescription = team?.description;
  const teamDescriptionDisplayName = useGetDisplayTextFromPlainTextJson(teamDescription || '');
  const teamLogo = team?.iconUrl;
  const teamDarkmodeLogo = team?.darkmodeIconUrl;

  return (
    <Card>
      <CardHeader className="relative">
        <CardTitle>{t('settings.account.team.title')}</CardTitle>
        {isOwner && <CardDescription>{t('settings.account.team.description')}</CardDescription>}
        <div className="absolute left-0 top-0 !mt-0 flex size-full items-center justify-end gap-2 p-6">
          <CreateTeam />
          <JoinPublicTeam />
        </div>
      </CardHeader>
      <CardContent className={cn('flex gap-4', !isOwner && 'pointer-events-none')}>
        <VinesImageEditor
          value={teamLogo}
          onChange={(val) => handleUpdateTeam('iconUrl', val)}
          tooltipI18nKey="settings.theme.team-logo.lightmode"
        >
          <Avatar className="size-10 cursor-pointer">
            <AvatarImage className="aspect-auto" src={teamLogo} alt={teamDisplayName} />
            <AvatarFallback className="rounded-none p-2 text-xs">{teamDisplayName.substring(0, 2)}</AvatarFallback>
          </Avatar>
        </VinesImageEditor>
        <VinesImageEditor
          value={teamDarkmodeLogo}
          onChange={(val) => handleUpdateTeam('darkmodeIconUrl', val)}
          tooltipI18nKey="settings.theme.team-logo.darkmode"
        >
          <Avatar className="size-10 cursor-pointer">
            <AvatarImage className="aspect-auto" src={teamDarkmodeLogo} alt={teamDisplayName} />
            <AvatarFallback className="rounded-none p-2 text-xs">{teamDisplayName.substring(0, 2)}</AvatarFallback>
          </Avatar>
        </VinesImageEditor>
        <div className="flex flex-col justify-center">
          <SimpleDisplayNameDialog
            // disabled={!isOwner}
            title={t('settings.account.team.team-name.title')}
            placeholder={t('settings.account.team.team-name.placeholder')}
            initialValue={teamDisplayName}
            onFinished={(val) => handleUpdateTeam('name', JSON.stringify(val))}
          >
            <div className="group flex cursor-pointer items-center gap-2 transition-opacity hover:opacity-75">
              <h3 className="line-clamp-1 font-semibold leading-tight">{teamDisplayName}</h3>
              <Pencil size={16} className="-mb-0.5 opacity-0 transition-opacity group-hover:opacity-100" />
            </div>
          </SimpleDisplayNameDialog>
          <SimpleDisplayNameDialog
            // disabled={!isOwner}
            title={t('settings.account.team.team-description.title')}
            placeholder={t('settings.account.team.team-description.placeholder')}
            initialValue={teamDescriptionDisplayName}
            onFinished={(val) => handleUpdateTeam('description', JSON.stringify(val))}
          >
            <div className="group flex cursor-pointer items-center gap-2 transition-opacity hover:opacity-75">
              <h3 className="line-clamp-1 text-xs">{teamDescriptionDisplayName}</h3>
              <Pencil size={12} className="opacity-0 transition-opacity group-hover:opacity-100" />
            </div>
          </SimpleDisplayNameDialog>
        </div>
      </CardContent>
      <CardFooter className="justify-end gap-2">
        {isOwner && (
          <>
            <ApplyManage teamId={team?.id} />
            <ImportExportTeam team={team} />
            <DeleteTeam teamId={team?.id} />
          </>
        )}
      </CardFooter>
    </Card>
  );
};
