import React, { memo } from 'react';

import { MoreVertical } from 'lucide-react';

import { useVinesPage } from '@/components/layout-wrapper/workspace/utils.ts';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu.tsx';
import { useForceUpdate } from '@/hooks/use-force-update.ts';

import { RenameGroup } from './renameGroup';
import { SetGroupIcon } from './setGroupIcon';

interface ITabMenuProps extends React.ComponentPropsWithoutRef<'div'> {
  onOpenChange?: (isOpen: boolean) => void;
  groupId: string;
}

export const NavDropdown: React.FC<ITabMenuProps> = memo(({ onOpenChange, groupId }) => {
  const { page, pages, pageId, pagesMutate, setPages } = useVinesPage();

  const forceUpdate = useForceUpdate();

  return (
    <DropdownMenu onOpenChange={onOpenChange}>
      <DropdownMenuTrigger asChild>
        <Button className="-m-1 scale-[.8] p-1 [&_svg]:stroke-gold-12" icon={<MoreVertical />} variant="borderless" />
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" alignOffset={-6} side="right" sideOffset={12}>
        <DropdownMenuGroup>
          <RenameGroup page={page} groupId={groupId} pages={pages} setPages={setPages} />
          <SetGroupIcon groupId={groupId} pages={pages} setPages={setPages} forceUpdate={forceUpdate} />
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
