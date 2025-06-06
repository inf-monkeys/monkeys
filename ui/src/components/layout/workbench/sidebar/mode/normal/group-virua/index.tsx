import React, { useRef } from 'react';

import { AnimatePresence, motion } from 'framer-motion';
import { FolderIcon } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { Virtualizer } from 'virtua';

import { IPageGroup, IPinPage } from '@/apis/pages/typings.ts';
import { ScrollArea } from '@/components/ui/scroll-area.tsx';
import { useOnlyShowWorkenchIcon } from '@/store/showWorkenchIcon';
import { cn } from '@/utils';

import { NavDropdown } from './navTab';
import { SideBarNavItem } from './SideBarNavItem';

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
  const onlyShowWorkenchIcon = useOnlyShowWorkenchIcon();
  const { t } = useTranslation();
  return (
    <div className="h-full p-4">
      <ScrollArea
        className={cn('', onlyShowWorkenchIcon ? 'w-[2.25rem]' : 'w-32')}
        ref={scrollRef}
        disabledOverflowMask
      >
        <Virtualizer scrollRef={scrollRef}>
          {data.map(({ displayName, id, iconUrl }, i) => (
            // <Button
            //   key={i}
            //   className={cn(
            //     'mb-2 w-full shrink-0 justify-start px-2 hover:bg-accent',
            //     groupId === id && 'border border-input bg-neocard',
            //   )}
            //   variant="ghost"
            //   icon={<FolderIcon />}
            //   onClick={() => setGroupId(id)}
            // >
            //   {!onlyShowWorkenchIcon ? displayName : ''}
            // </Button>
            <SideBarNavItem
              key={id}
              icon={iconUrl ?? FolderIcon}
              className={cn(
                'mb-2 flex h-10 w-full shrink-0 items-center justify-start gap-2 rounded px-2 hover:bg-accent',
                groupId === id && 'border border-input bg-neocard',
              )}
              displayName={t([`workspace.wrapper.space.tabs.${displayName}`, displayName])}
              onlyShowWorkenchIcon={onlyShowWorkenchIcon}
              onClick={() => setGroupId(id)}
            >
              <AnimatePresence>
                {id === groupId && !onlyShowWorkenchIcon && (
                  <motion.div
                    key={id + '_more_button'}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="absolute right-2 top-2"
                  >
                    <NavDropdown groupId={groupId} onOpenChange={(status) => void 0} />
                  </motion.div>
                )}
              </AnimatePresence>
            </SideBarNavItem>
          ))}
        </Virtualizer>
      </ScrollArea>
    </div>
  );
};
