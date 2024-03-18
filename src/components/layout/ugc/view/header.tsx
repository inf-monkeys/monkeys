import React, { useMemo } from 'react';

import { CreditCard, Images, Table2 } from 'lucide-react';

import { IDisplayMode } from '@/components/layout/ugc/typings.ts';
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
}

export const UgcViewHeader: React.FC<IUgcViewHeaderProps> = ({ assetKey, subtitle }) => {
  const team = useVinesTeam();

  const [displayMode, setDisplayMode] = useLocalStorage<IDisplayMode>(
    `vines-${team.teamId}-${assetKey}-display-mode`,
    'card',
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
                setDisplayMode(v as IDisplayMode);
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
