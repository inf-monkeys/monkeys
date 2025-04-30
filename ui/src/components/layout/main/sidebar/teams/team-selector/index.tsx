import React, { useState } from 'react';

import { useNavigate } from '@tanstack/react-router';

import { useMemoizedFn } from 'ahooks';
import { CheckIcon, ChevronsUpDown } from 'lucide-react';
import { useTranslation } from 'react-i18next';

import { Team } from '@/components/layout/main/sidebar/teams/team-selector/team.tsx';
import { useVinesTeam } from '@/components/router/guard/team.tsx';
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
import { cn } from '@/utils';

const NEED_FORCE_REFRESH = ['text-data', 'table-data', 'image-models'];

interface ITeamSelectorProps extends React.ComponentPropsWithoutRef<'div'> {
  size?: 'normal' | 'large';
}

export const TeamSelector: React.FC<ITeamSelectorProps> = ({ size = 'normal' }) => {
  const { t } = useTranslation();

  const { routeId } = useVinesRoute();
  const navigate = useNavigate() as any;

  const [open, setOpen] = useState(false);

  const { teams, teamId, setTeamId } = useVinesTeam();
  const currentTeam = (teams ?? []).find((team) => team.id === teamId);

  const handleSwapTeam = useMemoizedFn(async (id: string) => {
    setTeamId(id);

    const navRouteId = routeId?.replace(/.$/, '') ?? '';
    const splitRouteId = navRouteId.split('/').filter(Boolean);
    if (NEED_FORCE_REFRESH.includes(splitRouteId?.[1])) {
      await navigate({
        to: `/${splitRouteId.slice(0, 2).join('/')}`,
        params: {
          teamId: id,
        },
      });
    } else {
      await navigate({
        to: `${navRouteId}${navRouteId.endsWith('$teamId') ? '/' : ''}`,
        params: {
          teamId: id,
        },
      });
    }
  });

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          className={cn('justify-between gap-1', size === 'large' ? 'px-4 py-6' : 'px-3')}
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
