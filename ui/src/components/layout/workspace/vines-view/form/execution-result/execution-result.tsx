import React, { useEffect, useRef, useState } from 'react';

import { useAutoAnimate } from '@formkit/auto-animate/react';
import { isArray, isObject, isUndefined } from 'lodash';
import { Masonry, useInfiniteLoader } from 'masonic';
import { VListHandle } from 'virtua';

import { useWorkflowExecutionOutputs } from '@/apis/workflow/execution';
import { useVinesSimplifiedExecutionResult } from '@/components/layout/workspace/vines-view/form/execution-result/convertOutput.ts';
import { LOAD_LIMIT } from '@/components/layout/workspace/vines-view/form/execution-result/index.tsx';
import { IVinesExecutionResultItem } from '@/components/layout/workspace/vines-view/form/execution-result/virtua/item';
import { JSONValue } from '@/components/ui/code-editor';
import { ScrollArea } from '@/components/ui/scroll-area.tsx';
import {
  VinesWorkflowExecutionInput,
  VinesWorkflowExecutionOutputListItem,
} from '@/package/vines-flow/core/typings.ts';
import { cn } from '@/utils';
import { useDebounceFn } from 'ahooks';
import Image from 'rc-image';

interface IMasonryExecutionResultGridProps {
  data: IVinesExecutionResultItem[][];

  isMiniFrame?: boolean;
  workflowId?: string | null;
  total: number;
  width: number;
  height: number;
}

export const MasonryExecutionResultGrid: React.FC<IMasonryExecutionResultGridProps> = ({
  total,
  isMiniFrame,
  workflowId,
  height,
}) => {
  const scrollRef = useRef<HTMLDivElement>(null);

  const [animationParent, enableAutoAnimate] = useAutoAnimate();
  const scrolling = useRef(false);

  const [page, setPage] = useState(1);
  const { run: debouncedChangePage } = useDebounceFn(
    () => {
      setPage((prev) => prev + 1);
    },
    {
      wait: 300,
    },
  );
  const { data, isLoading } = useWorkflowExecutionOutputs(workflowId, page, LOAD_LIMIT, 0);
  const outputs = data?.data ?? [];

  const loadedPagesRef = useRef<number[]>([]);
  const loadedPageItemsLengthRef = useRef<number>(LOAD_LIMIT);
  const [list, setList] = useState<IVinesExecutionResultItem[]>([]);

  const { conversionOutputs } = useVinesSimplifiedExecutionResult();
  useEffect(() => {
    if (isUndefined(data) || loadedPagesRef.current.includes(page)) return;

    const resultList = conversionOutputs(outputs);
    if (resultList.length) {
      setList((prev) => [...prev, ...resultList]);
      loadedPagesRef.current.push(page);
      loadedPageItemsLengthRef.current += outputs.length;
    }
  }, [isMiniFrame, outputs, page]);

  const loader = () => {
    console.log('inf loader called');
    if (isLoading) {
      console.log('loaded pages', loadedPagesRef.current);
      console.log('list size', list.length);
      return;
    }
    console.log('try to load next page');
    console.log('loaded pages', loadedPagesRef.current);
    console.log('list size', list.length);
    console.log('total images', total);
    debouncedChangePage();
  };

  const infiniteLoader = useInfiniteLoader(loader, {
    totalItems: total,
    isItemLoaded: (index, items) => list.length <= total,
    threshold: 0,
  });
  const ref = useRef<VListHandle>(null);
  return (
    <ScrollArea
      className={cn(
        '-pr-0.5 z-20 mr-0.5 w-full bg-background [&>[data-radix-scroll-area-viewport]]:p-2',
        !total && 'hidden',
      )}
      ref={scrollRef}
      style={{ height: height }}
      disabledOverflowMask
    >
      <Masonry
        items={list}
        columnWidth={220}
        columnGutter={8}
        rowGutter={8}
        overscanBy={3}
        render={({ data }) => {
          return <MasnoryItem {...data} />;
        }}
        onRender={infiniteLoader}
      ></Masonry>
    </ScrollArea>
  );
};

type IMasonryExecutionResultItem = VinesWorkflowExecutionOutputListItem & {
  render: {
    type: 'image' | 'video' | 'text' | 'json' | 'empty';
    data: JSONValue;
    alt?:
    | string
    | string[]
    | { [imgUrl: string]: string }
    | {
      [imgUrl: string]: {
        type: 'copy-param';
        label: string;
        data: VinesWorkflowExecutionInput[];
      };
    }
    | undefined;
    index: number;
  };
};

const MasnoryItem: React.FC<IMasonryExecutionResultItem> = ({ render, ...it }) => {
  const { type, data, alt } = render;

  const altLabel = isArray(alt)
    ? alt[0]
    : (isObject(alt?.[data as string]) ? alt?.[data as string].label : alt?.[data as string]) || alt || '';
  const altContent = isArray(alt)
    ? altLabel
    : (isObject(alt?.[data as string]) && alt?.[data as string].type === 'copy-param'
      ? JSON.stringify({
        type: 'input-parameters',
        data: [...it.input, ...alt?.[data as string].data],
      })
      : alt?.[data as string]) ?? '';

  switch (type) {
    case 'image':
      return <Image src={data as string} />;
    /*      return (
            <VirtuaExecutionResultGridWrapper data={it} key={i} src={data as string}>
              <VirtuaExecutionResultGridImageItem
                src={data as string}
                alt={{
                  label: altLabel,
                  value: altContent
                }}
              />
            </VirtuaExecutionResultGridWrapper>
          );*/
    // case 'video':
    //   return (
    //     <VirtuaExecutionResultGridWrapper data={it} key={i} src={data as string}>
    //       <VinesAbstractVideo className="my-auto [&>video]:min-h-16">{data as string}</VinesAbstractVideo>
    //     </VirtuaExecutionResultGridWrapper>
    //   );
    default:
      // return <div>un handle yet</div>;
      return;
  }
};
