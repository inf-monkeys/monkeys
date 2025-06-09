import React, { useRef } from 'react';

import { FolderIcon } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { Virtualizer } from 'virtua';

import { IPageGroup, IPinPage } from '@/apis/pages/typings.ts';
import { ScrollArea } from '@/components/ui/scroll-area.tsx';
import { Separator } from '@/components/ui/separator.tsx';
import { useOnlyShowWorkbenchIcon } from '@/store/showWorkbenchIcon';
import { cn, getI18nContent } from '@/utils';

import { NavDropdown } from './navTab';
import { SideBarNavItem } from './sideBarNavItem';

interface IVirtuaWorkbenchViewGroupListProps extends React.ComponentPropsWithoutRef<'div'> {
  groupId: string;
  setGroupId: React.Dispatch<React.SetStateAction<string>>;
  data: (Omit<IPageGroup, 'pageIds'> & { pages: IPinPage[] })[];
}

export const VirtuaWorkbenchViewGroupList: React.FC<IVirtuaWorkbenchViewGroupListProps> = ({
  groupId,
  setGroupId,
  data,
}) => {
  const scrollRef = useRef<HTMLDivElement>(null);
  const onlyShowWorkbenchIcon = useOnlyShowWorkbenchIcon();
  const { t } = useTranslation();
  return (
    <div className="flex h-full pr-[1px]">
      <ScrollArea
        className={cn('px-4 pt-4', onlyShowWorkbenchIcon ? 'w-[4.8rem]' : 'min-w-44')}
        ref={scrollRef}
        disabledOverflowMask
      >
        <Virtualizer scrollRef={scrollRef}>
          {data.map(({ displayName, id, iconUrl }, i) => (
            <SideBarNavItem
              key={id}
              icon={iconUrl ?? FolderIcon}
              groupId={id}
              displayName={t([
                `workspace.wrapper.space.tabs.${getI18nContent(displayName) || 'unknown'}`,
                getI18nContent(displayName) || 'Unknown Group',
              ])}
              onlyShowWorkbenchIcon={onlyShowWorkbenchIcon}
              onClick={() => setGroupId(id)}
            >
              <NavDropdown groupId={id} />
            </SideBarNavItem>
          ))}
        </Virtualizer>
      </ScrollArea>
      <Separator orientation="vertical" />
    </div>
  );
};
