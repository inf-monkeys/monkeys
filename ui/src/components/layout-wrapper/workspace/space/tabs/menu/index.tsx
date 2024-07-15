import React, { memo } from 'react';

import { MoreVertical } from 'lucide-react';

import { DeletePage } from '@/components/layout-wrapper/workspace/space/tabs/menu/delete-page.tsx';
import { ViewGroup } from '@/components/layout-wrapper/workspace/space/tabs/menu/group';
import { PinView } from '@/components/layout-wrapper/workspace/space/tabs/menu/pin-view.tsx';
import { useVinesPage } from '@/components/layout-wrapper/workspace/utils.ts';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu.tsx';

interface ITabMenuProps extends React.ComponentPropsWithoutRef<'div'> {}

export const TabMenu: React.FC<ITabMenuProps> = memo(() => {
  const { workflowId, page, pages, pageId, navigateTo, pagesMutate, setPages } = useVinesPage();

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button className="!scale-80 [&_svg]:stroke-gold-12" icon={<MoreVertical />} variant="borderless" />
      </DropdownMenuTrigger>
      <DropdownMenuContent>
        <DropdownMenuGroup>
          <PinView page={page} pageId={pageId} pages={pages} setPages={setPages} />
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
