import React, { useEffect, useMemo, useRef, useState } from 'react';

import { useDebounceFn } from 'ahooks';
import { AnimatePresence, motion } from 'framer-motion';
import { isArray, isObject } from 'lodash';
import { CirclePause, History } from 'lucide-react';
import { Masonry, useInfiniteLoader } from 'masonic';
import { useTranslation } from 'react-i18next';

import { useWorkflowExecutionOutputs } from '@/apis/workflow/execution';
import { VinesAbstractDataPreview } from '@/components/layout/workspace/vines-view/_common/data-display/abstract';
import { useVinesIframeMessage } from '@/components/layout/workspace/vines-view/form/execution-result/iframe-message.ts';
import { LOAD_LIMIT } from '@/components/layout/workspace/vines-view/form/execution-result/index.tsx';
import { useVinesExecutionResult } from '@/components/layout/workspace/vines-view/form/execution-result/use-vines-execution-result.ts';
import { IVinesExecutionResultItem } from '@/components/layout/workspace/vines-view/form/execution-result/virtua/item';
import { VirtuaExecutionResultGridImageItem } from '@/components/layout/workspace/vines-view/form/execution-result/virtua/item/image.tsx';
import { VirtuaExecutionResultGridWrapper } from '@/components/layout/workspace/vines-view/form/execution-result/virtua/item/wrapper/index.tsx';
import { Label } from '@/components/ui/label.tsx';
import { VinesLoading } from '@/components/ui/loading';
import { ScrollArea } from '@/components/ui/scroll-area.tsx';
import { usePageStore } from '@/store/usePageStore';
import { cn } from '@/utils';

interface IMasonryExecutionResultGridProps {
  workflowId: string | null;
  height: number;

  enablePostMessage?: boolean;
}

export const MasonryExecutionResultGrid: React.FC<IMasonryExecutionResultGridProps> = ({
  workflowId,
  height,
  enablePostMessage,
}) => {
  const { t } = useTranslation();

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

  const { data, isLoading, mutate } = useWorkflowExecutionOutputs(workflowId, page, LOAD_LIMIT);

  const { conversionOutputs } = useVinesExecutionResult();

  const currentPageExecutionsCount = useMemo(() => data?.data.length ?? 0, [data?.data]);

  const currentPageExecutionResultItems = useMemo(() => conversionOutputs(data?.data ?? []), [data?.data]);

  const currentPageExecutionsResultItemsCount = currentPageExecutionResultItems.length;

  const totalExecutionCount = data?.total ?? 0;

  useVinesIframeMessage({ outputs: currentPageExecutionResultItems, mutate, enable: enablePostMessage });

  const loadedPagesRef = useRef<number[]>([]);
  const loadedPageExecutionsLengthRef = useRef<number>(LOAD_LIMIT);
  // const loadedPageExecutionsResultItemsLengthRef = useRef<number>(LOAD_LIMIT);
  const [list, setList] = useState<IVinesExecutionResultItem[]>([]);

  useEffect(() => {
    if (!loadedPagesRef.current.includes(page)) {
      setList((prev) => [...prev, ...currentPageExecutionResultItems]);
      loadedPagesRef.current.push(page);
      loadedPageExecutionsLengthRef.current += currentPageExecutionsCount;
    } else {
      setList((prev) => {
        const startIndex = loadedPagesRef.current.indexOf(page) * LOAD_LIMIT;
        const newList = [...prev];
        for (let i = 0; i < currentPageExecutionsResultItemsCount; i++) {
          if (startIndex + i < newList.length) {
            newList[startIndex + i] = currentPageExecutionResultItems[i];
          } else {
            newList.push(currentPageExecutionResultItems[i]);
          }
        }
        return newList;
        // return [...prev, ...currentPageExecutionResultItems];
      });
    }
  }, [page, currentPageExecutionResultItems, totalExecutionCount]);

  useEffect(() => {
    console.log(list, currentPageExecutionResultItems, totalExecutionCount);
  }, [list, currentPageExecutionResultItems]);

  // 使用useInfiniteLoader钩子来优化无限滚动
  const infiniteLoader = useInfiniteLoader(
    () => {
      console.log('load more');
      // 如果正在加载或已加载全部内容，则不触发
      if (isLoading || loadedPageExecutionsLengthRef.current >= totalExecutionCount) {
        return;
      }

      console.log(currentPageExecutionsCount);

      // 只有当当前页面的数据都已经加载完毕时才加载下一页
      if (currentPageExecutionsCount == LOAD_LIMIT) {
        debouncedChangePage();
      }
    },
    {
      // isItemLoaded: (index, items) => !!items[index], // 检查项目是否已加载
      // threshold: 3, // 提前加载的阈值，较高的值可以提前触发加载
    },
  );

  const containerWidth = usePageStore((s) => s.containerWidth);

  return (
    <>
      <ScrollArea
        className={cn(
          '-pr-0.5 z-20 mr-0.5 bg-background [&>[data-radix-scroll-area-viewport]]:p-2',
          !totalExecutionCount && 'hidden',
        )}
        ref={scrollRef}
        style={{ height }}
        disabledOverflowMask
      >
        <Masonry
          items={list}
          ssrWidth={(containerWidth - 48) * 0.6 - 16}
          columnWidth={200} // 调整列宽，确保在容器内能完整显示
          columnGutter={12} // 稍微增加列间距以提高可读性
          rowGutter={12}
          render={({ data }) => {
            return <MasnoryItem {...data} />;
          }}
          onRender={infiniteLoader}
        />
      </ScrollArea>
      <AnimatePresence mode="popLayout">
        {isLoading ? (
          <motion.div
            key="vines-execution-result-loading"
            className="vines-center pointer-events-none absolute left-0 top-0 z-0 size-full"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1, transition: { delay: 0.5 } }}
            exit={{ opacity: 0 }}
          >
            <VinesLoading />
          </motion.div>
        ) : currentPageExecutionsResultItemsCount ? null : (
          <motion.div
            key="vines-execution-result-empty"
            className="vines-center pointer-events-none absolute left-0 top-0 z-0 size-full flex-col gap-2"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1, transition: { delay: 0.3 } }}
            exit={{ opacity: 0 }}
          >
            <History size={64} />
            <Label className="text-sm">{t('workspace.logs-view.log.list.empty')}</Label>
          </motion.div>
        )}
      </AnimatePresence>
    </>
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
        <div
          key={render.key}
          className="flex h-40 items-center justify-center rounded-lg border border-input shadow-sm"
        >
          <VinesLoading />
        </div>
      );
    case 'PAUSED':
      return (
        <div
          key={render.key}
          className="flex h-40 items-center justify-center rounded-lg border border-input shadow-sm"
        >
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
