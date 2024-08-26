import React, { useRef } from 'react';

import { useCreation } from 'ahooks';
import { Virtualizer } from 'virtua';

import { VirtuaIconGridItem } from '@/components/ui/icon-selector/virtua/item.tsx';
import { ScrollArea } from '@/components/ui/scroll-area.tsx';

interface IVirtuaIconGridProps {
  data: string[];

  rowCount: number;

  height: number;
  onIconSelect?: (iconName: string) => void;
}

export const VirtuaIconGrid: React.FC<IVirtuaIconGridProps> = ({ data, height, rowCount, onIconSelect }) => {
  const scrollRef = useRef<HTMLDivElement>(null);

  const list = useCreation(() => {
    if (data.length > 0) {
      const result: string[][] = [];
      for (let i = 0; i < data.length; i += rowCount) {
        result.push(data.slice(i, i + rowCount));
      }
      return result;
    }
    return [];
  }, [rowCount, data]);

  return (
    <ScrollArea ref={scrollRef} style={{ height }} disabledOverflowMask>
      <Virtualizer scrollRef={scrollRef}>
        {list.map((icons, i) => (
          <div key={i} className="mb-2 flex gap-2">
            {icons.map((name) => (
              <VirtuaIconGridItem key={name} name={name} onClick={onIconSelect} />
            ))}
          </div>
        ))}
      </Virtualizer>
    </ScrollArea>
  );
};
