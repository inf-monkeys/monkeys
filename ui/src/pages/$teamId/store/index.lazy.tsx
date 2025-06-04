import React, { useEffect, useRef, useState } from 'react';

import { createLazyFileRoute } from '@tanstack/react-router';

import { ChevronRightIcon, FilterIcon } from 'lucide-react';
import { Virtualizer, VListHandle } from 'virtua';

import { useUgcApplicationStore } from '@/apis/ugc';
import { IApplicationStoreItemDetail } from '@/apis/ugc/asset-typings.ts';
import { StoreApp } from '@/components/layout/ugc-pages/store/app.tsx';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { VinesLoading } from '@/components/ui/loading';
import { ScrollArea } from '@/components/ui/scroll-area.tsx';
import { VinesIcon } from '@/components/ui/vines-icon';

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

const NewStorePage: React.FC = () => {
  return (
    <main className="flex h-full w-full flex-col p-4">
      <section className="mb-4 grid min-h-[192px] w-full flex-col rounded-xl">
        <ScrollArea disabledOverflowMask>
          <div className="grid size-full grid-cols-[repeat(auto-fit,minmax(200px,1fr))] gap-3 rounded-lg brightness-125 backdrop-blur-3xl">
            <FilterSectionButton />
            <FilterSectionButton />
            <FilterSectionButton />
            <FilterSectionButton />
            <FilterSectionButton />
            <FilterSectionButton />
            <FilterSectionButton />
            <FilterSectionButton />
            <FilterSectionButton />
            <FilterSectionButton />
            <FilterSectionButton />
            <FilterSectionButton />
            <FilterSectionButton />
            <FilterSectionButton />
            <FilterSectionButton />
            <FilterSectionButton />
            <FilterSectionButton />
            <FilterSectionButton />
            <FilterSectionButton />
            <FilterSectionButton />
            <FilterSectionButton />
            <FilterSectionButton />
            <FilterSectionButton />
          </div>
        </ScrollArea>
      </section>
      <ScrollArea className="grid h-full w-full" disabledOverflowMask>
        <div className="grid h-full w-full grid-cols-[repeat(auto-fit,minmax(260px,1fr))] gap-4">
          <StoreCard />
          <StoreCard />
          <StoreCard />
          <StoreCard />
          <StoreCard />
          <StoreCard />
          <StoreCard />
          <StoreCard />
          <StoreCard />
          <StoreCard />
          <StoreCard />
          <StoreCard />
          <StoreCard />
          <StoreCard />
          <StoreCard />
          <StoreCard />
          <StoreCard />
          <StoreCard />
          <StoreCard />
          <StoreCard />
          <StoreCard />
          <StoreCard />
          <StoreCard />
          <StoreCard />
          <StoreCard />
          <StoreCard />
          <StoreCard />
          <StoreCard />
          <StoreCard />
          <StoreCard />
          <StoreCard />
          <StoreCard />
          <StoreCard />
          <StoreCard />
          <StoreCard />
        </div>
      </ScrollArea>
    </main>
  );
};

const CategoryButton: React.FC = () => {
  return <Button>Category</Button>;
};

const StoreWrapper: React.FC = () => {};

const StoreCard: React.FC = () => {
  return (
    <Card className="min-h-80 w-full rounded-xl bg-neocard p-2">
      <CardContent className="flex flex-col gap-2 p-0">
        <div>
          <img
            src={'/hutomo.jpg'}
            alt={`Photo by <a href="https://unsplash.com/@marvelous?utm_content=creditCopyText&utm_medium=referral&utm_source=unsplash">Marvin Meyer</a> on <a href="https://unsplash.com/photos/people-sitting-down-near-table-with-assorted-laptop-computers-SYTO3xs06fU?utm_content=creditCopyText&utm_medium=referral&utm_source=unsplash">Unsplash</a>
      `}
            className="aspect-square w-full rounded-lg bg-white object-cover"
          />
        </div>
        <div className="grid place-items-center">
          <div className="flex flex-row items-center gap-2">
            <VinesIcon className="size-4" src="https://cdnjs.cloudflare.com/ajax/libs/twemoji/14.0.2/72x72/1f340.png" />
            <span className="text line-clamp-1 font-bold">Some random text</span>
          </div>
        </div>
        <div className="flex flex-row gap-2">
          <StoreCardCategory />
          <StoreCardCategory />
          <StoreCardCategory />
        </div>
      </CardContent>
    </Card>
  );
};

export const Route = createLazyFileRoute('/$teamId/store/')({
  component: NewStorePage,
});

const StoreCardCategory: React.FC = () => {
  return (
    <div className="flex items-center rounded bg-primary-foreground px-2 py-1 text-xs text-primary">
      <span className="line-clamp-1">Some</span>
    </div>
  );
};

const FilterSectionButton: React.FC = () => {
  return (
    <Button className="min-h-14 justify-between !bg-[#3A3A3A] opacity-100 [&_svg]:stroke-accent">
      <div className="flex flex-row items-center gap-2">
        <FilterIcon className="stroke-none text-black" size={16} />
        <span className="line-clamp-1 font-semibold text-accent">Filter</span>
      </div>
      <ChevronRightIcon className="place-content-end" size={16} />
    </Button>
  );
};
