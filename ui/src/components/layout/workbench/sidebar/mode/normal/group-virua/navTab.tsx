import React, { memo } from 'react';

import { MoreVertical } from 'lucide-react';

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
  const forceUpdate = useForceUpdate();

  return (
    <DropdownMenu onOpenChange={onOpenChange}>
      <DropdownMenuTrigger asChild>
        <Button className="-m-1 scale-[.8] p-1 [&_svg]:stroke-gold-12" icon={<MoreVertical />} variant="borderless" />
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" alignOffset={-6} side="right" sideOffset={12}>
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
