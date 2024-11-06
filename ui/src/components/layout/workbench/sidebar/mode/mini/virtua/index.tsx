import React, { useRef } from 'react';

import { Virtualizer } from 'virtua';

import { IPinPage } from '@/apis/pages/typings.ts';
import { VirtuaWorkbenchMiniViewListItem } from '@/components/layout/workbench/sidebar/mode/mini/virtua/item.tsx';
import { ScrollArea } from '@/components/ui/scroll-area.tsx';

interface IVirtuaWorkbenchMiniViewListProps {
  data: IPinPage[] | null;

  height: number;
  currentPageId?: string;
  onItemClicked?: (page: IPinPage) => void;

  mini?: boolean;
}

export const VirtuaWorkbenchMiniViewList: React.FC<IVirtuaWorkbenchMiniViewListProps> = ({
  data,
  height,
  currentPageId,
  onItemClicked,
  mini,
}) => {
  const scrollRef = useRef<HTMLDivElement>(null);

  return (
    <ScrollArea className="-mr-2 pr-2" ref={scrollRef} style={{ height }} disabledOverflowMask>
      <Virtualizer scrollRef={scrollRef}>
        {data?.map((it, i) => (
          <VirtuaWorkbenchMiniViewListItem
            key={i}
            data={it}
            currentPageId={currentPageId}
            onClick={onItemClicked}
            mini={mini}
          />
        ))}
      </Virtualizer>
    </ScrollArea>
  );
};
