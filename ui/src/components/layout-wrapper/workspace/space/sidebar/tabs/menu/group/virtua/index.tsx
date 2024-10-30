import React, { useRef } from 'react';

import { KeyedMutator } from 'swr/_internal';

import { Virtualizer } from 'virtua';

import { IPageGroup } from '@/apis/pages/typings.ts';
import { GroupItem } from '@/components/layout-wrapper/workspace/space/sidebar/tabs/menu/group/item.tsx';
import { ScrollArea } from '@/components/ui/scroll-area.tsx';

interface IVirtuaPinGroupListProps {
  data: IPageGroup[];

  pageId: string;
  mutate: KeyedMutator<IPageGroup[] | undefined>;
}

export const VirtuaPinGroupList: React.FC<IVirtuaPinGroupListProps> = ({ data, pageId, mutate }) => {
  const scrollRef = useRef<HTMLDivElement>(null);

  return (
    <ScrollArea className="-mr-1 flex max-h-44 w-52 flex-col overflow-y-auto pr-1" ref={scrollRef} disabledOverflowMask>
      <Virtualizer scrollRef={scrollRef}>
        {data.map((it, i) => (
          <GroupItem key={i} group={it} pageId={pageId} mutate={mutate} />
        ))}
      </Virtualizer>
    </ScrollArea>
  );
};
