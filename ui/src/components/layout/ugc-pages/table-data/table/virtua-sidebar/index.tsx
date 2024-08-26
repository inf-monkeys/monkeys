import React, { useRef } from 'react';

import { Virtualizer } from 'virtua';

import { IDatabaseTable } from '@/apis/table-data/typings.ts';
import { VirtuaDatabaseTableListItem } from '@/components/layout/ugc-pages/table-data/table/virtua-sidebar/item.tsx';
import { ScrollArea } from '@/components/ui/scroll-area.tsx';

interface IVirtuaDatabaseTableListProps {
  data: IDatabaseTable[];

  height: number;
}

export const VirtuaDatabaseTableList: React.FC<IVirtuaDatabaseTableListProps> = ({ data, height }) => {
  const scrollRef = useRef<HTMLDivElement>(null);

  return (
    <ScrollArea className="w-full" ref={scrollRef} style={{ height }} disabledOverflowMask>
      <Virtualizer scrollRef={scrollRef}>
        {data.map((it, i) => (
          <VirtuaDatabaseTableListItem name={it.name} key={i} />
        ))}
      </Virtualizer>
    </ScrollArea>
  );
};
