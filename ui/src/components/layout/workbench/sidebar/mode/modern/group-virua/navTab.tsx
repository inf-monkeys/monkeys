import React, { memo } from 'react';

import { useMemoizedFn } from 'ahooks';
import { EllipsisIcon } from 'lucide-react';
import { useTranslation } from 'react-i18next';

import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu.tsx';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';

import { RenameGroup } from './renameGroup';
import { SetGroupIcon } from './setGroupIcon';

interface ITabMenuProps extends React.ComponentPropsWithoutRef<'div'> {
  groupId: string;
}

export const NavDropdown: React.FC<ITabMenuProps> = memo(({ groupId }) => {
  const { t } = useTranslation();

  const handleClickMoreMenu = useMemoizedFn((e: React.MouseEvent<HTMLButtonElement, MouseEvent>) => {
    e.stopPropagation();
    e.preventDefault();
  });
  return (
    <DropdownMenu>
      <Tooltip>
        <DropdownMenuTrigger asChild>
          <TooltipTrigger asChild>
            <Button
              variant="outline"
              icon={<EllipsisIcon />}
              className="pointer-events-none absolute right-6 !p-1.5 opacity-0 transition-opacity group-hover:pointer-events-auto group-hover:opacity-100 [&>div>svg]:size-3"
              onClick={handleClickMoreMenu}
            />
          </TooltipTrigger>
        </DropdownMenuTrigger>
        <TooltipContent side="right">{t('workspace.flow-view.tooltip.more.tip')}</TooltipContent>
      </Tooltip>
      <DropdownMenuContent side="right" align="start" sideOffset={12}>
        <DropdownMenuGroup>
          <RenameGroup groupId={groupId} />
          <SetGroupIcon groupId={groupId} />
          {/* <ViewGroup pageId={pageId} pagesMutate={pagesMutate} /> */}
          {/*<DropdownMenuSeparator />*/}
          {/*<DeletePage*/}
          {/*  workflowId={workflowId}*/}
          {/*  pagesMutate={pagesMutate}*/}
          {/*  page={page}*/}
          {/*  pageId={pageId}*/}
          {/*  navigateTo={navigateTo}*/}
          {/*/>*/}
        </DropdownMenuGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  );
});

NavDropdown.displayName = 'TabMenu';
