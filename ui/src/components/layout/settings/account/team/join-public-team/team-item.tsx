import React from 'react';

import { useTranslation } from 'react-i18next';

import { IVinesTeam } from '@/apis/authz/team/typings.ts';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar.tsx';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card.tsx';

interface IJoinPublicTeamItemProps extends React.ComponentPropsWithoutRef<'div'> {
  team: IVinesTeam;
  isHandleAccept: boolean;
  handleApplyTeam: (id: string) => void;
}

export const JoinPublicTeamItem: React.FC<IJoinPublicTeamItemProps> = ({ team, isHandleAccept, handleApplyTeam }) => {
  const { t } = useTranslation();
  return (
    <Card>
      <CardContent className="flex items-center justify-between gap-global p-3">
        <div className="flex items-center gap-global">
          <Avatar className="size-10">
            <AvatarImage className="aspect-auto" src={team.iconUrl} alt={team.name} />
            <AvatarFallback className="rounded-none p-2 text-xs">{team.name.substring(0, 2)}</AvatarFallback>
          </Avatar>
          <div>
            <h1 className="line-clamp-1 font-semibold leading-tight">{team.name}</h1>
            <span className="line-clamp-1 text-xs text-opacity-70">{team.description}</span>
          </div>
        </div>
        <div className="flex gap-2">
          <Button disabled={isHandleAccept} onClick={() => handleApplyTeam(team.id)}>
            {t('settings.account.team.join-public-team.team-item.apply')}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};
