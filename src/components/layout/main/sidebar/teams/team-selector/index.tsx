import React, { useEffect } from 'react';

import { useNavigate } from '@tanstack/react-router';

import { useTeamBalance, useTeams } from '@/apis/authz/team';
import { Team } from '@/components/layout/main/sidebar/teams/team-selector/team.tsx';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select.tsx';
import { useLocalStorage } from '@/utils';

export const TeamSelector: React.FC = () => {
  const navigate = useNavigate({ from: location.pathname });

  const { mutate: teamBalanceMutate } = useTeamBalance();
  const { data: teams } = useTeams();
  const [teamId, setTeamId] = useLocalStorage<string>('vines-team-id', (teams ?? [])[0]?.id ?? '', false);

  useEffect(() => {
    if (!teams || teamId) return;
    teams.length && setTeamId(teams[0].id);
  }, [teams]);

  const currentTeam = (teams ?? []).find((team) => team.id === teamId);

  const handleSwapTeam = (id: string) => {
    setTeamId(id);
    void navigate({
      to: '/$teamId',
      params: {
        teamId: id,
      },
    });
    void teamBalanceMutate();
  };

  return (
    <Select value={teamId} onValueChange={handleSwapTeam}>
      <SelectTrigger className="flex h-auto cursor-pointer items-center gap-2 bg-mauve-2">
        <SelectValue>
          <Team logo={currentTeam?.logoUrl} name={currentTeam?.name} description={currentTeam?.description} />
        </SelectValue>
      </SelectTrigger>
      <SelectContent>
        {teams?.map(({ id, logoUrl, name, description }) => (
          <SelectItem key={id} value={id} className="cursor-pointer">
            <Team logo={logoUrl} name={name} description={description} />
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
};
