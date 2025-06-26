import React, { useEffect, useState } from 'react';

import { type EventEmitter } from 'ahooks/lib/useEventEmitter';
import { AnimatePresence, motion } from 'framer-motion';
import { History } from 'lucide-react';
import { useTranslation } from 'react-i18next';

import { useWorkflowExecutionList, useWorkflowExecutionListInfinite } from '@/apis/workflow/execution';
import { ExecutionResultGrid } from '@/components/layout/workspace/vines-view/form/execution-result/grid';
import { Card, CardContent } from '@/components/ui/card.tsx';
import { Label } from '@/components/ui/label.tsx';
import { VinesLoading } from '@/components/ui/loading';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useForceUpdate } from '@/hooks/use-force-update.ts';
import { VinesWorkflowExecutionOutputListItem } from '@/package/vines-flow/core/typings.ts';
import { ImagesResult, useSetExecutionImages } from '@/store/useExecutionImageResultStore';
import { useSetThumbImages } from '@/store/useExecutionImageTumbStore';
import { useFlowStore } from '@/store/useFlowStore';
import { useShouldFilterError } from '@/store/useShouldErrorFilterStore';
import { useViewStore } from '@/store/useViewStore';
import { cn } from '@/utils';
import { IVinesExecutionResultItem, newConvertExecutionResultToItemList, removeRepeatKey } from '@/utils/execution.ts';

import { ErrorFilter } from './grid/error-filter';
import { useVinesIframeMessage } from './iframe-message';
import { getThumbUrl } from './virtua/item/image';

interface IVinesExecutionResultProps extends React.ComponentPropsWithoutRef<'div'> {
  event$: EventEmitter<void>;
  height: number;

  enablePostMessage?: boolean;
  isMiniFrame?: boolean;
}

export const LOAD_LIMIT = 50;
export const VinesExecutionResult: React.FC<IVinesExecutionResultProps> = ({
  className,
  event$,
  height,
  enablePostMessage,
}) => {
  const { t } = useTranslation();

  const forceUpdate = useForceUpdate();
  event$.useSubscription(() => forceUpdate());

  const visible = useViewStore((s) => s.visible);
  const storeWorkflowId = useFlowStore((s) => s.workflowId);
  const workflowId = storeWorkflowId && visible ? storeWorkflowId : null;

  const [executionResultList, setExecutionResultList] = useState<IVinesExecutionResultItem[]>([]);

  const {
    data: executionListData,
    mutate: mutateExecutionList,
    size: currentPage,
    setSize: setCurrentPage,
    isLoading,
  } = useWorkflowExecutionListInfinite(workflowId, LOAD_LIMIT);

  const { data: firstPageExecutionListData } = useWorkflowExecutionList(workflowId, 1, LOAD_LIMIT);
  const firstPageExecutionList = firstPageExecutionListData?.data ?? [];
  const hasMore =
    executionListData?.length != 0 &&
    executionListData?.[currentPage - 1]?.total != 0 &&
    executionListData?.[currentPage - 1]?.data.length == LOAD_LIMIT;

  const totalCount = executionListData?.[0]?.total ?? 0;

  // 统一的数据更新和转换逻辑
  useEffect(() => {
    // 如果无限滚动数据为空，直接返回
    if (!executionListData || executionListData.length === 0 || executionListData[0]?.total === 0) {
      setExecutionResultList([]);
      return;
    }

    // 获取所有现有的原始数据
    const allExistingItems: VinesWorkflowExecutionOutputListItem[] = [];
    for (const execution of executionListData) {
      if (execution && execution.data) {
        allExistingItems.push(...execution.data);
      }
    }

    // 如果有第一页数据，进行原始数据层面的更新
    let finalRawData = allExistingItems;
    if (firstPageExecutionList.length > 0) {
      // 创建现有数据的映射（基于 instanceId）
      const existingMap = new Map(allExistingItems.map((item) => [item.instanceId, item]));

      // 处理第一页最新数据
      const newItems: VinesWorkflowExecutionOutputListItem[] = [];
      for (const item of firstPageExecutionList) {
        if (existingMap.has(item.instanceId)) {
          // 整体替换已存在的项目（状态、时间等可能都更新了）
          existingMap.set(item.instanceId, item);
        } else {
          // 收集新增项目
          newItems.push(item);
        }
      }

      // 合并：新增项目在前 + 更新后的现有项目
      finalRawData = [...newItems, ...Array.from(existingMap.values())];
    }

    // 统一转换为渲染数据
    const renderList = newConvertExecutionResultToItemList(finalRawData);

    // 去重并设置最终结果
    setExecutionResultList(removeRepeatKey(renderList));
  }, [executionListData, firstPageExecutionList]);

  const setImages = useSetExecutionImages();
  const setThumbImages = useSetThumbImages();
  // filter results for image detail route
  useEffect(() => {
    const allImages = executionResultList.filter((item) => item.render.type.toLowerCase() === 'image');
    // const filerMap = new Map<string, any>();
    const thumbImages: ImagesResult[] = [];
    for (const image of allImages) {
      const url = image.render.data as string;
      const thumbUrl = getThumbUrl(url);
      thumbImages.push({ ...image, render: { ...image.render, data: thumbUrl } } as ImagesResult);
    }
    setImages(allImages as ImagesResult[]);
    setThumbImages(thumbImages);
  }, [executionResultList, setImages, setThumbImages]);

  useVinesIframeMessage({
    outputs: executionResultList,
    mutate: mutateExecutionList,
    enable: enablePostMessage,
  });
  const shouldFilterError = useShouldFilterError();
  const [filteredData, setFilteredData] = useState<IVinesExecutionResultItem[]>([]);

  useEffect(() => {
    if (shouldFilterError) {
      const filtered = executionResultList.filter((item) => {
        if (item.render.type === 'json') {
          const data = item.render.data;
          if (data && (data as { message?: string }).message?.includes('失败')) {
            return false;
          }
          if (
            data &&
            (data as { success?: boolean }).success !== undefined &&
            (data as { success?: boolean }).success === false
          ) {
            return false;
          }
        }
        return !['FAILED', 'PAUSED'].includes(item.render.status);
      });
      setFilteredData(filtered);
    } else {
      setFilteredData(executionResultList);
    }
  }, [executionResultList, shouldFilterError]);
  return (
    <Card className={cn('relative rounded-xl !border-none bg-neocard !shadow-none', className)}>
      <CardContent className="p-0">
        {executionResultList && executionResultList.length > 0 && filteredData.length > 0 && !isLoading ? (
          <ExecutionResultGrid
            workflowId={workflowId}
            height={height}
            setPage={setCurrentPage}
            data={filteredData}
            hasMore={hasMore}
            event$={event$}
            mutate={mutateExecutionList}
          />
        ) : (
          <>
            <div className="flex justify-between gap-2 p-2">
              <ErrorFilter />
              {/* <ExtraButtonFilter /> */}
              <div className="vines-center pointer-events-none absolute left-0 top-0 z-0 size-full flex-col gap-2">
                <History size={64} />
                {/* // Execution records filtered to empty */}
                <Label className="text-sm">
                  {t(
                    executionResultList.length === filteredData.length
                      ? 'workspace.logs-view.log.list.empty'
                      : 'workspace.logs-view.log.list.filtered-empty',
                  )}
                </Label>
              </div>
            </div>
            <ScrollArea
              style={{ height: height - 40 }}
              className="z-20 mr-0.5 rounded-xl bg-neocard [&>[data-radix-scroll-area-viewport]]:p-2"
            ></ScrollArea>
          </>
        )}
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
          ) : (
            !totalCount && (
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
            )
          )}
        </AnimatePresence>
      </CardContent>
    </Card>
  );
};
