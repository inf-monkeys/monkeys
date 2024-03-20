import React, { useMemo } from 'react';

import { KeyedMutator } from 'swr';

import _ from 'lodash';
import { CreditCard, Images, RefreshCw, Table2 } from 'lucide-react';

import { IDisplayMode, IDisplayModeStorage } from '@/components/layout/ugc/typings.ts';
import { useVinesTeam } from '@/components/router/guard/team.tsx';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu.tsx';
import { Tooltip, TooltipTrigger } from '@/components/ui/tooltip';
import { useLocalStorage } from '@/utils';

interface IUgcViewHeaderProps extends React.ComponentPropsWithoutRef<'div'> {
  assetKey: string;
  subtitle?: React.ReactNode;
  mutate?: KeyedMutator<any>;
}

export const UgcViewHeader: React.FC<IUgcViewHeaderProps> = ({ assetKey, subtitle, mutate }) => {
  const team = useVinesTeam();

  const [displayModeStorage, setDisplayModeStorage] = useLocalStorage<IDisplayModeStorage>(
    `vines-ui-asset-display-mode`,
    {},
  );

  const displayMode = useMemo(
    () => _.get(displayModeStorage, [team.teamId, assetKey], 'card'),
    [displayModeStorage, team.teamId, assetKey],
  );

  const displayModeIcon = useMemo(
    () =>
      displayMode ? (
        displayMode === 'table' ? (
          <Table2 />
        ) : displayMode === 'gallery' ? (
          <Images />
        ) : (
          <CreditCard />
        )
      ) : (
        <CreditCard />
      ),
    [displayMode],
  );
  return (
    <header className="flex w-full items-center justify-end px-4 pb-2">
      <div className="flex gap-2">
        {mutate && (
          <Tooltip content="刷新">
            <TooltipTrigger asChild>
              <Button
                icon={<RefreshCw />}
                onClick={() => {
                  mutate();
                }}
              />
            </TooltipTrigger>
          </Tooltip>
        )}
        <DropdownMenu>
          <Tooltip content="展示方式">
            <TooltipTrigger asChild>
              <DropdownMenuTrigger asChild>
                <Button icon={displayModeIcon} />
              </DropdownMenuTrigger>
            </TooltipTrigger>
          </Tooltip>
          <DropdownMenuContent>
            <DropdownMenuLabel>展示方式</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuRadioGroup
              value={displayMode ?? 'card'}
              onValueChange={(v) => {
                setDisplayModeStorage((prev) => {
                  return {
                    ...prev,
                    [team.teamId]: {
                      ...prev[team.teamId],
                      [assetKey]: v as IDisplayMode,
                    },
                  };
                });
              }}
            >
              <DropdownMenuRadioItem value="table">表格视图</DropdownMenuRadioItem>
              <DropdownMenuRadioItem value="gallery">画廊视图</DropdownMenuRadioItem>
              <DropdownMenuRadioItem value="card">卡片视图</DropdownMenuRadioItem>
            </DropdownMenuRadioGroup>
          </DropdownMenuContent>
        </DropdownMenu>
        {subtitle}
      </div>
    </header>
  );
};
