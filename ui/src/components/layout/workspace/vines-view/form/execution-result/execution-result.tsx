import React, { useEffect, useRef, useState } from 'react';

import { useDebounceFn, useMount } from 'ahooks';
import { isArray, isObject, isUndefined } from 'lodash';
import { CirclePause } from 'lucide-react';
import { Masonry, useInfiniteLoader } from 'masonic';

import { useWorkflowExecutionOutputs } from '@/apis/workflow/execution';
import { VinesAbstractDataPreview } from '@/components/layout/workspace/vines-view/_common/data-display/abstract';
import { useVinesSimplifiedExecutionResult } from '@/components/layout/workspace/vines-view/form/execution-result/convert-output.ts';
import { LOAD_LIMIT } from '@/components/layout/workspace/vines-view/form/execution-result/index.tsx';
import { IVinesExecutionResultItem } from '@/components/layout/workspace/vines-view/form/execution-result/virtua/item';
import { VirtuaExecutionResultGridImageItem } from '@/components/layout/workspace/vines-view/form/execution-result/virtua/item/image.tsx';
import { VirtuaExecutionResultGridWrapper } from '@/components/layout/workspace/vines-view/form/execution-result/virtua/item/wrapper/index.tsx';
import { VinesLoading } from '@/components/ui/loading';
import { ScrollArea } from '@/components/ui/scroll-area.tsx';
import { cn } from '@/utils';

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

  const [page, setPage] = useState(1);
  const { run: debouncedChangePage } = useDebounceFn(
    () => {
      setPage((prev) => prev + 1);
    },
    {
      wait: 300,
    },
  );
  const { data, isLoading } = useWorkflowExecutionOutputs(workflowId, page, LOAD_LIMIT, 1000);
  const outputs = data?.data ?? [];

  const loadedPagesRef = useRef<number[]>([]);
  const loadedPageItemsLengthRef = useRef<number>(LOAD_LIMIT);
  const [list, setList] = useState<IVinesExecutionResultItem[]>([]);

  const { conversionOutputs } = useVinesSimplifiedExecutionResult();
  useEffect(() => {
    if (isUndefined(data)) return;

    const resultList = conversionOutputs(outputs);
    if (resultList.length) {
      if (!loadedPagesRef.current.includes(page)) {
        setList((prev) => [...prev, ...resultList]);
        loadedPagesRef.current.push(page);
        loadedPageItemsLengthRef.current += outputs.length;
      } else {
        setList((prev) => {
          const startIndex = loadedPagesRef.current.indexOf(page) * LOAD_LIMIT;
          const newList = [...prev];
          for (let i = 0; i < resultList.length; i++) {
            if (startIndex + i < newList.length) {
              newList[startIndex + i] = resultList[i];
            } else {
              newList.push(resultList[i]);
            }
          }
          return newList;
        });
      }
    }
  }, [isMiniFrame, outputs, page, conversionOutputs, data]);

  // 无限滚动加载器，当用户滚动到底部时触发
  const loader = () => {
    // 如果正在加载或已加载全部内容，则不触发
    if (isLoading || loadedPageItemsLengthRef.current >= total) {
      return;
    }

    // 只有当当前页面的数据都已经加载完毕时才加载下一页
    if (outputs.length === LOAD_LIMIT) {
      debouncedChangePage();
    }
  };

  // 使用useInfiniteLoader钩子来优化无限滚动
  const infiniteLoader = useInfiniteLoader(loader, {
    totalItems: total, // 总项目数
    isItemLoaded: (index) => index < list.length, // 检查项目是否已加载
    threshold: 3, // 提前加载的阈值，较高的值可以提前触发加载
  });
  const [shouldShowMasonry, setShowMasonry] = useState(false);
  // const forceUpdate = useForceUpdate();
  // const event$ = useEventEmitter();
  // event$.useSubscription(() => {
  //   forceUpdate();
  // });
  useMount(() => {
    setTimeout(() => setShowMasonry(true), 350);
  });

  return (
    <ScrollArea
      className={cn('-pr-0.5 z-20 mr-0.5 bg-background [&>[data-radix-scroll-area-viewport]]:p-2', !total && 'hidden')}
      ref={scrollRef}
      style={{ height: height }}
      disabledOverflowMask
    >
      {shouldShowMasonry && (
        <Masonry
          items={list}
          columnWidth={200} // 调整列宽，确保在容器内能完整显示
          columnGutter={12} // 稍微增加列间距以提高可读性
          rowGutter={12}
          overscanBy={5} // 增加预渲染的项目数，提高滚动性能
          render={({ data }) => {
            return <MasnoryItem {...data} />;
          }}
          onRender={infiniteLoader}
        />
      )}
    </ScrollArea>
  );
};

// 瀑布流项目组件
const MasnoryItem: React.FC<IVinesExecutionResultItem> = ({ render, ...it }) => {
  const { type, data, alt, status } = render;

  const altLabel = isArray(alt)
    ? alt[0]
    : (isObject(alt?.[data as string]) ? alt?.[data as string].label : alt?.[data as string]) || alt || '';
  const altContent = isArray(alt)
    ? altLabel
    : (isObject(alt?.[data as string]) && alt?.[data as string].type === 'copy-param'
      ? JSON.stringify({
        type: 'input-parameters',
        data: [...it.input, ...(alt?.[data as string]?.data ?? [])],
      })
      : alt?.[data as string]) ?? '';

  switch (status) {
    case 'SCHEDULED':
    case 'RUNNING':
      return (
        <div className="flex h-40 items-center justify-center rounded-lg border border-input shadow-sm">
          <VinesLoading />
        </div>
      );
    case 'PAUSED':
      return (
        <div className="flex h-40 items-center justify-center rounded-lg border border-input shadow-sm">
          <CirclePause className="stroke-yellow-12" size={48} />
        </div>
      );
  }

  switch (type) {
    case 'image':
      // 使用包装组件来支持下载和删除功能
      return (
        <div className="relative overflow-hidden rounded-lg border border-input shadow-sm">
          <VirtuaExecutionResultGridWrapper data={{ ...it, render }} src={data as string}>
            <div className="h-full w-full" onClick={(e) => e.stopPropagation()}>
              <VirtuaExecutionResultGridImageItem
                src={data as string}
                alt={{
                  label: altLabel,
                  value: altContent,
                }}
                instanceId={it.instanceId}
                outputIndex={render.index}
              />
            </div>
          </VirtuaExecutionResultGridWrapper>
        </div>
      );
    default:
      return (
        <VirtuaExecutionResultGridWrapper data={{ ...it, render }}>
          <div className="overflow-hidden rounded-lg border border-input p-2 shadow-sm">
            <VinesAbstractDataPreview data={data} className="h-full" />
          </div>
        </VirtuaExecutionResultGridWrapper>
      );
  }
};
