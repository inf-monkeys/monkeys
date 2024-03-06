import React, { useEffect, useState } from 'react';

import { useMatches, useNavigate } from '@tanstack/react-router';

import { CheckIcon, ChevronsUpDown } from 'lucide-react';

import { useTeams } from '@/apis/authz/team';
import { useTeamBalance } from '@/apis/authz/team/payment';
import { Team } from '@/components/layout/main/sidebar/teams/team-selector/team.tsx';
import { Button } from '@/components/ui/button';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from '@/components/ui/command';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { cn, useLocalStorage } from '@/utils';

export const TeamSelector: React.FC = () => {
  const matches = useMatches();
  const navigate = useNavigate({ from: location.pathname });

  const { mutate: teamBalanceMutate } = useTeamBalance();
  const { data: teams } = useTeams();
  const [teamId, setTeamId] = useLocalStorage<string>('vines-team-id', (teams ?? [])[0]?.id ?? '', false);

  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (!teams || teamId) return;
    teams.length && setTeamId(teams[0].id);
  }, [teams]);

  const currentTeam = (teams ?? []).find((team) => team.id === teamId);

  const handleSwapTeam = async (id: string) => {
    setTeamId(id);
    await navigate({
      to: matches.find((it) => it.routeId.includes('/$teamId'))?.routeId?.replace(/.$/, ''),
      params: {
        teamId: id,
      },
    });
    void teamBalanceMutate();
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          className="justify-between gap-1 px-3"
          aria-expanded={open}
          aria-label="Select a team"
        >
          <Team
            className="w-32"
            logo={currentTeam?.logoUrl}
            name={currentTeam?.name}
            description={currentTeam?.description}
          />
          <ChevronsUpDown className="h-4 w-4 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[168px] p-0">
        <Command>
          <CommandList>
            <CommandInput placeholder="搜索团队..." />
            <CommandEmpty>找不到团队</CommandEmpty>
          </CommandList>
          <CommandSeparator />
          <CommandList>
            <CommandGroup>
              {teams?.map(({ id, logoUrl, name, description }) => (
                <CommandItem
                  key={id}
                  className="cursor-pointer"
                  onSelect={() => {
                    void handleSwapTeam(id);
                    setOpen(false);
                  }}
                >
                  <Team logo={logoUrl} name={name} description={description} />
                  <CheckIcon className={cn('ml-auto', teamId === id ? 'opacity-100' : 'opacity-0')} size={18} />
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
};
