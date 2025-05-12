import React, { useRef } from 'react';

import { Virtualizer } from 'virtua';

import { IPageGroup, IPinPage } from '@/apis/pages/typings.ts';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area.tsx';
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

  return (
    <div className="h-full min-w-32 p-4">
      <ScrollArea className="-mr-3 pr-3" ref={scrollRef} disabledOverflowMask>
        <Virtualizer scrollRef={scrollRef}>
          {data.map(({ displayName, id }, i) => (
            <Button
              key={i}
              className={cn(
                'mb-2 w-full justify-start px-2 hover:bg-accent',
                groupId === id && 'dark:bg-card-dark bg-card-light border border-input',
              )}
              variant="ghost"
              onClick={() => setGroupId(id)}
            >
              {displayName}
            </Button>
          ))}
        </Virtualizer>
      </ScrollArea>
    </div>
  );
};
