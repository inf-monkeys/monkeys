import React, { memo } from 'react';

import { MoreVertical } from 'lucide-react';

import { DeletePage } from '@/components/layout-wrapper/workspace/space/sidebar/tabs/menu/delete-page.tsx';
import { ViewGroup } from '@/components/layout-wrapper/workspace/space/sidebar/tabs/menu/group';
import { RenameView } from '@/components/layout-wrapper/workspace/space/sidebar/tabs/menu/rename-view.tsx';
import { SetViewIcon } from '@/components/layout-wrapper/workspace/space/sidebar/tabs/menu/set-view-icon.tsx';
import { useVinesPage } from '@/components/layout-wrapper/workspace/utils.ts';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu.tsx';
import { useForceUpdate } from '@/hooks/use-force-update.ts';

interface ITabMenuProps extends React.ComponentPropsWithoutRef<'div'> {
  onOpenChange?: (isOpen: boolean) => void;
}

export const TabMenu: React.FC<ITabMenuProps> = memo(({ onOpenChange }) => {
  const { workflowId, page, pages, pageId, navigateTo, pagesMutate, setPages } = useVinesPage();

  const forceUpdate = useForceUpdate();

  return (
    <DropdownMenu onOpenChange={onOpenChange}>
      <DropdownMenuTrigger asChild>
        <Button className="-m-1 scale-[.8] p-1 [&_svg]:stroke-gold-12" icon={<MoreVertical />} variant="borderless" />
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" alignOffset={-6} side="right" sideOffset={12}>
        <DropdownMenuGroup>
          <RenameView page={page} pageId={pageId} pages={pages} setPages={setPages} />
          <SetViewIcon pageId={pageId} pages={pages} setPages={setPages} forceUpdate={forceUpdate} />
          <ViewGroup pageId={pageId} pagesMutate={pagesMutate} />
          <DropdownMenuSeparator />
          <DeletePage
            workflowId={workflowId}
            pagesMutate={pagesMutate}
            page={page}
            pageId={pageId}
            navigateTo={navigateTo}
          />
        </DropdownMenuGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  );
});

TabMenu.displayName = 'TabMenu';
