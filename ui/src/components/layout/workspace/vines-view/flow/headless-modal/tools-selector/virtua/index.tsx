import React, { useRef } from 'react';

import { useCreation } from 'ahooks';
import { Virtualizer } from 'virtua';

import { VirtuaToolListItem } from '@/components/layout/workspace/vines-view/flow/headless-modal/tools-selector/virtua/item.tsx';
import { ScrollArea } from '@/components/ui/scroll-area.tsx';
import { VinesToolDef } from '@/package/vines-flow/core/tools/typings.ts';

interface IVirtuaToolListProps {
  data: VinesToolDef[];

  category: string;
  rowCount: number;

  height: number;
  onItemClicked?: (tool: VinesToolDef) => void;
}

export const VirtuaToolList: React.FC<IVirtuaToolListProps> = ({ data, category, rowCount, height, onItemClicked }) => {
  const scrollRef = useRef<HTMLDivElement>(null);

  const list = useCreation(() => {
    if (data.length > 0) {
      const result: VinesToolDef[][] = [];
      for (let i = 0; i < data.length; i += rowCount) {
        result.push(data.slice(i, i + rowCount));
      }
      return result;
    }
    return [];
  }, [rowCount, data]);

  return (
    <ScrollArea className="-mr-2 pr-2" ref={scrollRef} style={{ height }} disabledOverflowMask>
      <Virtualizer scrollRef={scrollRef}>
        {list.map((tools, i) => (
          <div key={i} className="mb-1 flex gap-1">
            {tools.map((it, t) => (
              <VirtuaToolListItem key={t} tool={it} category={category} onClick={onItemClicked} />
            ))}
          </div>
        ))}
      </Virtualizer>
    </ScrollArea>
  );
};
