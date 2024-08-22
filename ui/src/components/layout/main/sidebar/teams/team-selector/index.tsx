import React, { useEffect, useState } from 'react';

import { useNavigate } from '@tanstack/react-router';

import { CheckIcon, ChevronsUpDown } from 'lucide-react';
import { useTranslation } from 'react-i18next';

import { useTeams } from '@/apis/authz/team';
import { Team } from '@/components/layout/main/sidebar/teams/team-selector/team.tsx';
import { useVinesRoute } from '@/components/router/use-vines-route.ts';
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
import { ScrollArea } from '@/components/ui/scroll-area.tsx';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { useLocalStorage } from '@/hooks/use-local-storage';
import { cn } from '@/utils';

export const TeamSelector: React.FC = () => {
  const { t } = useTranslation();

  const { routeId } = useVinesRoute();
  const navigate = useNavigate({ from: location.pathname });

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
    localStorage.removeItem('vines-ui-workbench-page');
    await navigate({
      to: routeId?.replace(/.$/, ''),
      params: {
        teamId: id,
      },
    });
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
          <Team className="w-32" logo={currentTeam?.iconUrl} name={currentTeam?.name} />
          <ChevronsUpDown className="h-4 w-4 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[168px] p-0">
        <Command>
          <CommandList>
            <CommandInput placeholder={t('components.layout.main.sidebar.teams.team-selector.search-team')} />
            <CommandEmpty>{t('components.layout.main.sidebar.teams.team-selector.not-found')}</CommandEmpty>
          </CommandList>
          <CommandSeparator />
          <CommandList>
            <CommandGroup>
              <ScrollArea className="flex max-h-60 flex-col overflow-y-auto" disabledOverflowMask>
                {teams?.map(({ id, iconUrl, name, description }) => {
                  const teamName = t([`components.layout.main.sidebar.teams.${name ?? ''}`, name ?? '']);

                  return (
                    <Tooltip key={id}>
                      <CommandItem
                        value={`${teamName}-${description}-${id}`}
                        className="p-0"
                        onSelect={() => {
                          void handleSwapTeam(id);
                          setOpen(false);
                        }}
                      >
                        <TooltipTrigger asChild>
                          <div className="group flex w-full cursor-pointer select-none items-center px-2 py-1.5 text-sm">
                            <Team logo={iconUrl} name={teamName} description={description} />
                            <CheckIcon
                              className={cn('ml-auto', teamId === id ? 'opacity-100' : 'opacity-0')}
                              size={18}
                            />
                          </div>
                        </TooltipTrigger>
                      </CommandItem>

                      <TooltipContent side="right" sideOffset={14}>
                        {teamName}
                        <br />
                        <span className="text-xxs text-muted-foreground">{id}</span>
                      </TooltipContent>
                    </Tooltip>
                  );
                })}
              </ScrollArea>
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
};
