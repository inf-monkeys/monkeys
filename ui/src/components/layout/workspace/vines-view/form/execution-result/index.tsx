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
import { ImagesResult, useExecutionImageResultStore } from '@/store/useExecutionImageResultStore';
import { useSetThumbImages } from '@/store/useExecutionImageTumbStore';
import { useFlowStore } from '@/store/useFlowStore';
import { useShouldFilterError } from '@/store/useShouldErrorFilterStore';
import { useViewStore } from '@/store/useViewStore';
import { cn } from '@/utils';
import {
  convertExecutionResultToItemList,
  IVinesExecutionResultItem,
  newConvertExecutionResultToItemList,
} from '@/utils/execution.ts';

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

const removeRepeatKey = (executionResultList: IVinesExecutionResultItem[]) => {
  const map = new Map<string, IVinesExecutionResultItem>();
  for (const item of executionResultList) {
    if (!map.has(item.render.key)) {
      map.set(item.render.key, item);
    }
  }
  return Array.from(map.values());
};

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
  const firstPageExecutionRenderList = newConvertExecutionResultToItemList(firstPageExecutionList);
  const hasMore =
    executionListData?.length != 0 &&
    executionListData?.[currentPage - 1]?.total != 0 &&
    executionListData?.[currentPage - 1]?.data.length == LOAD_LIMIT;

  const totalCount = executionListData?.[0]?.total ?? 0;

  useEffect(() => {
    if (!executionListData || executionListData.length == 0 || executionListData[0]?.total == 0) return;
    const list: IVinesExecutionResultItem[] = [];
    for (const execution of executionListData ?? []) {
      if (execution && execution.data) {
        list.push(...newConvertExecutionResultToItemList(execution.data));
      }
    }
    setExecutionResultList([...list]);
  }, [executionListData]);

  // 第一页任务及状态变化
  useEffect(() => {
    // 筛选状态变更的替换原 result
    const changed = firstPageExecutionRenderList.filter(
      (r) =>
        executionResultList.findIndex(
          (pr) => r.render.key === pr.render.key && r.status != pr.status && !pr.render.isDeleted,
        ) != -1,
    );

    // 筛选不存在的拼接到头部
    const nonExist = firstPageExecutionList.filter(
      (r) => !executionResultList.map(({ instanceId }) => instanceId).includes(r.instanceId),
    );

    // 没有变化返回
    if (changed.length == 0 && nonExist.length == 0) return;

    setExecutionResultList((prevList) => {
      for (const changedExecution of changed) {
        const index = prevList.findIndex((pr) => changedExecution.instanceId === pr.instanceId);
        // prevList[index].render = {
        //   ...prevList[index].render,
        //   isDeleted: true,
        // };
        prevList = prevList.filter((_, i) => i != index);
        prevList.splice(index, 0, ...convertExecutionResultToItemList(changedExecution));
      }
      for (const nonExistExecution of nonExist.reverse()) {
        prevList.unshift(...convertExecutionResultToItemList(nonExistExecution));
      }
      return [...prevList];
    });
  }, [firstPageExecutionList]);

  const { setImages } = useExecutionImageResultStore();
  const setThumbImages = useSetThumbImages();
  // filter results for image detail route
  useEffect(() => {
    const allImages = executionResultList.filter((item) => item.render.type.toLowerCase() === 'image');
    const filerMap = new Map<string, any>();
    const thumbImages: ImagesResult[] = [];
    for (const image of allImages) {
      const url = image.render.data as string;
      if (!filerMap.has(url)) {
        filerMap.set(url, image);
        const thumbUrl = getThumbUrl(url);
        // if (await checkImageUrlAvailable(thumbUrl)) {
        thumbImages.push({ ...image, render: { ...image.render, data: thumbUrl } } as ImagesResult);
        // } else {
        //   thumbImages.push(image as ImagesResult);
        // }
      } else {
        continue;
      }
    }
    setImages(Array.from(filerMap.values()) as ImagesResult[]);
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
    <Card className={cn('relative rounded-xl bg-neocard', className)}>
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
          <ScrollArea
            style={{ height }}
            className="z-20 mr-0.5 rounded-xl bg-neocard [&>[data-radix-scroll-area-viewport]]:p-2"
          >
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
          </ScrollArea>
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
