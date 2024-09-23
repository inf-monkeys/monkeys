import React, { useRef } from 'react';

import { Virtualizer } from 'virtua';

import { IUgcFilterRules } from '@/apis/ugc/typings.ts';
import { VirtuaUgcFilterListItem } from '@/components/layout/ugc/view/filter/list/virtua/item.tsx';
import { ScrollArea } from '@/components/ui/scroll-area.tsx';

interface IVirtualUgcFilterListProps {
  data: Partial<IUgcFilterRules>[];

  height: number;
  currentRuleId: string;

  onItemClicked?: (ruleId: string) => void;
  onItemDeleteClicked?: (ruleId: string) => void;
}

export const VirtualUgcFilterList: React.FC<IVirtualUgcFilterListProps> = ({
  data,
  height,
  currentRuleId,
  onItemClicked,
  onItemDeleteClicked,
}) => {
  const scrollRef = useRef<HTMLDivElement>(null);

  return (
    <ScrollArea ref={scrollRef} style={{ height }} disabledOverflowMask>
      <Virtualizer scrollRef={scrollRef}>
        {data.map((it, i) => (
          <VirtuaUgcFilterListItem
            key={i}
            data={it}
            currentRuleId={currentRuleId}
            onClick={onItemClicked}
            onClickDelete={onItemDeleteClicked}
          />
        ))}
      </Virtualizer>
    </ScrollArea>
  );
};
