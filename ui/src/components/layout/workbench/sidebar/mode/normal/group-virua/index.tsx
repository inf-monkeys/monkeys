import React, { useRef } from 'react';

import { FolderIcon } from 'lucide-react';
import { Virtualizer } from 'virtua';

import { IPageGroup, IPinPage } from '@/apis/pages/typings.ts';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area.tsx';
import { useOnlyShowWorkenchIcon } from '@/store/showWorkenchIcon';
import { cn } from '@/utils';

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
  return (
    <div className="h-full p-4">
      <ScrollArea
        className={cn('', onlyShowWorkenchIcon ? 'w-[2.25rem]' : 'w-32')}
        ref={scrollRef}
        disabledOverflowMask
      >
        <Virtualizer scrollRef={scrollRef}>
          {data.map(({ displayName, id }, i) => (
            <Button
              key={i}
              className={cn(
                'mb-2 w-full shrink-0 justify-start px-2 hover:bg-accent',
                groupId === id && 'border border-input bg-neocard',
              )}
              variant="ghost"
              icon={<FolderIcon />}
              onClick={() => setGroupId(id)}
            >
              {!onlyShowWorkenchIcon ? displayName : ''}
            </Button>
          ))}
        </Virtualizer>
      </ScrollArea>
    </div>
  );
};
