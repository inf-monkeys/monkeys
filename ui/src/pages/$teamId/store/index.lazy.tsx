import React, { useEffect, useRef, useState } from 'react';

import { createLazyFileRoute } from '@tanstack/react-router';

import { Virtualizer, VListHandle } from 'virtua';

import { useUgcApplicationStore } from '@/apis/ugc';
import { IApplicationStoreItemDetail } from '@/apis/ugc/asset-typings.ts';
import { StoreApp } from '@/components/layout/ugc-pages/store/app.tsx';
import { VinesLoading } from '@/components/ui/loading';
import { ScrollArea } from '@/components/ui/scroll-area.tsx';

const limit = 42;

const StorePage: React.FC = () => {
  const [page, setPage] = useState(1);
  const { data, isLoading, mutate } = useUgcApplicationStore({ page, limit });

  const scrollRef = useRef<HTMLDivElement>(null);

  const apps = data?.data ?? [];
  const [list, setList] = useState<IApplicationStoreItemDetail[][]>([]);
  const loadedItemsLengthRef = useRef<number>(0);
  useEffect(() => {
    if (!apps.length) return;
    const newList = apps.reduce((acc, cur, index) => {
      const i = Math.floor(index / 6);
      if (!acc[i]) {
        acc[i] = [];
      }
      acc[i].push(cur);
      return acc;
    }, [] as IApplicationStoreItemDetail[][]);
    setList((prev) => prev.concat(newList));
    loadedItemsLengthRef.current += apps.length;
  }, [apps]);

  const ref = useRef<VListHandle>(null);
  const appsTotal = data?.total ?? 0;

  return (
    <ScrollArea className="flex max-h-full flex-col overflow-y-auto" ref={scrollRef} disabledOverflowMask>
      <Virtualizer
        ref={ref}
        scrollRef={scrollRef}
        onScroll={(offset) => {
          if (!ref.current) return;
          if (offset - ref.current.scrollSize + ref.current.viewportSize >= -1.5 && !isLoading) {
            if (appsTotal > loadedItemsLengthRef.current) {
              setPage((prev) => prev + 1);
            }
          }
        }}
      >
        {list.map((row, i) => (
          <div key={i} className="mb-4 grid w-full grid-cols-6 gap-4">
            {row.map((it) => (
              <StoreApp key={it.id} mutate={mutate} {...it} />
            ))}
          </div>
        ))}
      </Virtualizer>
      {isLoading && <VinesLoading className="flex w-full justify-center" />}
    </ScrollArea>
  );
};

export const Route = createLazyFileRoute('/$teamId/store/')({
  component: StorePage,
});
