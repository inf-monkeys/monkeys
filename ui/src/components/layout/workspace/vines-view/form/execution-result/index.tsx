import React, { useCallback, useEffect, useRef, useState } from 'react';

import { type EventEmitter } from 'ahooks/lib/useEventEmitter';
import { AnimatePresence, motion } from 'framer-motion';
import { get } from 'lodash';
import { History } from 'lucide-react';
import { useTranslation } from 'react-i18next';

import { useSystemConfig } from '@/apis/common';
import {
  getWorkflowExecutionSimple,
  useWorkflowExecutionList,
  useWorkflowExecutionListInfinite,
} from '@/apis/workflow/execution';
import { ExecutionResultGrid } from '@/components/layout/workspace/vines-view/form/execution-result/grid';
import { Card, CardContent } from '@/components/ui/card.tsx';
import { Label } from '@/components/ui/label.tsx';
import { VinesLoading } from '@/components/ui/loading';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useForceUpdate } from '@/hooks/use-force-update.ts';
import { useLocalStorage } from '@/hooks/use-local-storage';
import { VinesWorkflowExecutionOutputListItem } from '@/package/vines-flow/core/typings.ts';
import { ImagesResult, useSetExecutionImages } from '@/store/useExecutionImageResultStore';
import { useSetThumbImages } from '@/store/useExecutionImageTumbStore';
import { useExecutionStore } from '@/store/useExecutionStore';
import { useFlowStore } from '@/store/useFlowStore';
import { useShouldFilterError } from '@/store/useShouldErrorFilterStore';
import { useViewStore } from '@/store/useViewStore';
import { cn } from '@/utils';
import { IVinesExecutionResultItem, newConvertExecutionResultToItemList, removeRepeatKey } from '@/utils/execution.ts';
import { getThumbUrl } from '@/utils/file';

import { ErrorFilter } from './grid/error-filter';
import { useVinesIframeMessage } from './iframe-message';

interface IVinesExecutionResultProps extends React.ComponentPropsWithoutRef<'div'> {
  event$: EventEmitter<void>;
  height: number;

  enablePostMessage?: boolean;
  isMiniFrame?: boolean;
}

const isSameIframeOutputs = (
  prev: VinesWorkflowExecutionOutputListItem[],
  next: VinesWorkflowExecutionOutputListItem[],
) => {
  if (prev.length !== next.length) return false;
  for (let i = 0; i < next.length; i += 1) {
    if (prev[i]?.instanceId !== next[i]?.instanceId || prev[i]?.status !== next[i]?.status) {
      return false;
    }
  }
  return true;
};

export const LOAD_LIMIT = 50;
const getUpdateTimestamp = (value?: number | string | Date) => {
  if (!value) return 0;
  if (typeof value === 'number') return value;
  const ts = new Date(value).getTime();
  return Number.isNaN(ts) ? 0 : ts;
};

const getItemTimestamp = (item: VinesWorkflowExecutionOutputListItem) =>
  getUpdateTimestamp(item.updateTime ?? item.endTime ?? item.startTime);

const FINAL_STATUSES = new Set(['COMPLETED', 'FAILED', 'TERMINATED', 'CANCELED', 'CANCELLED']);
const RUNNING_INSTANCES_STORAGE_KEY = 'vines-workflow-running-instances';
type RunningInstanceStorage = Record<string, Record<string, RunningInstanceMeta>>;
interface RunningInstanceMeta {
  instanceId: string;
  workflowId: string;
  updatedAt: number;
}

export const VinesExecutionResult: React.FC<IVinesExecutionResultProps> = ({
  className,
  event$,
  height,
  enablePostMessage,
}) => {
  const { t } = useTranslation();

  const { data: oem } = useSystemConfig();

  const { setStatus } = useExecutionStore();

  const showErrorFilter = oem?.theme?.workflowPreviewExecutionGrid?.showErrorFilter ?? true;

  const forceUpdate = useForceUpdate();
  event$.useSubscription(() => forceUpdate());

  const visible = useViewStore((s) => s.visible);
  const storeWorkflowId = useFlowStore((s) => s.workflowId);
  const workflowId = storeWorkflowId && visible ? storeWorkflowId : null;

  const [runningInstanceStorage, setRunningInstanceStorage] = useLocalStorage<RunningInstanceStorage>(
    RUNNING_INSTANCES_STORAGE_KEY,
    {},
  );

  const [executionResultList, setExecutionResultList] = useState<IVinesExecutionResultItem[]>([]);
  const [updateExecutionResultList, setUpdateExecutionResultList] = useState<VinesWorkflowExecutionOutputListItem[]>(
    [],
  );
  const [iframeOutputs, setIframeOutputs] = useState<VinesWorkflowExecutionOutputListItem[]>([]);
  const [localRunningOutputs, setLocalRunningOutputs] = useState<VinesWorkflowExecutionOutputListItem[]>([]);
  const latestInstanceMetaRef = useRef<Map<string, { status: string; timestamp: number }>>(new Map());
  const pendingInstanceIdsRef = useRef<Set<string>>(new Set());
  const pollingTimerRef = useRef<number>();
  const addRunningInstanceToStorage = useCallback(
    (targetWorkflowId: string | null, instance: VinesWorkflowExecutionOutputListItem) => {
      if (!targetWorkflowId) return;
      setRunningInstanceStorage((prev) => {
        const next = { ...prev };
        const workflowInstances = { ...(next[targetWorkflowId] ?? {}) };
        if (workflowInstances[instance.instanceId]) {
          return prev;
        }
        workflowInstances[instance.instanceId] = {
          workflowId: targetWorkflowId,
          instanceId: instance.instanceId,
          updatedAt: Date.now(),
        };
        next[targetWorkflowId] = workflowInstances;
        return next;
      });
    },
    [setRunningInstanceStorage],
  );

  const removeRunningInstanceFromStorage = useCallback(
    (targetWorkflowId: string | null, instanceId: string) => {
      if (!targetWorkflowId) return;
      setRunningInstanceStorage((prev) => {
        const workflowInstances = prev?.[targetWorkflowId];
        if (!workflowInstances || !workflowInstances[instanceId]) {
          return prev;
        }
        const nextWorkflowInstances = { ...workflowInstances };
        delete nextWorkflowInstances[instanceId];
        const next = { ...prev };
        if (Object.keys(nextWorkflowInstances).length > 0) {
          next[targetWorkflowId] = nextWorkflowInstances;
        } else {
          delete next[targetWorkflowId];
        }
        return next;
      });
    },
    [setRunningInstanceStorage],
  );

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
    firstPageExecutionListData?.total != 0 &&
    executionListData?.[currentPage - 1]?.data.length == LOAD_LIMIT;

  const totalCount = firstPageExecutionListData?.total ?? 0;

  const enableSystemImageThumbnail = get(oem, ['theme', 'imageThumbnail'], false);

  // 统一的数据更新和转换逻辑
  useEffect(() => {
    const hasLocalFallback = localRunningOutputs.length > 0;
    const remoteTotal = firstPageExecutionListData?.total ?? 0;
    const hasRemoteData = executionListData && executionListData.length > 0 && remoteTotal !== 0;
    if (!hasRemoteData && !hasLocalFallback) {
      setExecutionResultList([]);
      return;
    }

    // 获取所有现有的原始数据
    const allExistingItems: VinesWorkflowExecutionOutputListItem[] = [];
    if (localRunningOutputs.length > 0) {
      allExistingItems.push(...localRunningOutputs);
    }
    for (const execution of executionListData ?? []) {
      if (execution && execution.data) {
        allExistingItems.push(...execution.data);
      }
      allExistingItems.unshift(...updateExecutionResultList);
    }

    // 如果有第一页数据，进行原始数据层面的更新
    let finalRawData = allExistingItems;
    let nextIframeOutputs: VinesWorkflowExecutionOutputListItem[] = [];
    if (firstPageExecutionList.length > 0) {
      // 创建现有数据的映射（基于 instanceId）
      const existingMap = new Map(allExistingItems.map((item) => [item.instanceId, item]));

      // 处理第一页最新数据
      const newItems: VinesWorkflowExecutionOutputListItem[] = [];
      const eventItems: VinesWorkflowExecutionOutputListItem[] = [];
      const pushedInstanceIds = new Set<string>();
      const pushEventItem = (item: VinesWorkflowExecutionOutputListItem) => {
        if (pushedInstanceIds.has(item.instanceId)) return;
        eventItems.push(item);
        pushedInstanceIds.add(item.instanceId);
      };
      for (const item of firstPageExecutionList) {
        const incomingTimestamp = getItemTimestamp(item);
        const meta = latestInstanceMetaRef.current.get(item.instanceId);
        const hasStatusChanged = item.status !== meta?.status;
        const isNewerTimestamp = incomingTimestamp >= (meta?.timestamp ?? 0);
        const shouldUpdateMeta = !meta || isNewerTimestamp;

        if (existingMap.has(item.instanceId)) {
          const existingItem = existingMap.get(item.instanceId);
          if (shouldUpdateMeta) {
            existingMap.set(item.instanceId, item);
          } else {
            existingMap.set(item.instanceId, existingItem!);
          }
        } else {
          newItems.push(item);
        }

        if (shouldUpdateMeta) {
          const isRunning = item.status === 'RUNNING';
          const isFinal = FINAL_STATUSES.has(item.status);
          const isPending = pendingInstanceIdsRef.current.has(item.instanceId);

          if (isRunning && !isPending) {
            pendingInstanceIdsRef.current.add(item.instanceId);
            pushEventItem(item);
            addRunningInstanceToStorage(workflowId, item);
          } else if (isFinal) {
            if (isPending && hasStatusChanged) {
              pendingInstanceIdsRef.current.delete(item.instanceId);
              pushEventItem(item);
            }
            removeRunningInstanceFromStorage(workflowId, item.instanceId);
          }

          latestInstanceMetaRef.current.set(item.instanceId, { status: item.status, timestamp: incomingTimestamp });
        }
      }

      // 合并并按时间排序：将所有项目按 startTime 降序排列（最新的在前）
      // 同时将 RUNNING 和 SCHEDULED 状态的项目排在最前面
      const allItems = Array.from(existingMap.values());
      finalRawData = allItems.sort((a, b) => {
        // 首先按状态排序：RUNNING/SCHEDULED 优先
        const statusPriorityA = ['RUNNING', 'SCHEDULED'].includes(a.status) ? 0 : 1;
        const statusPriorityB = ['RUNNING', 'SCHEDULED'].includes(b.status) ? 0 : 1;

        if (statusPriorityA !== statusPriorityB) {
          return statusPriorityA - statusPriorityB;
        }

        // 相同状态优先级时，按时间降序排列
        const timeA = a.startTime || 0;
        const timeB = b.startTime || 0;
        return timeB - timeA; // 降序：新的在前
      });
      setUpdateExecutionResultList(eventItems);
      nextIframeOutputs = eventItems;
    } else {
      setUpdateExecutionResultList([]);
    }

    if (finalRawData.length === 0 && updateExecutionResultList.length > 0) {
      finalRawData = updateExecutionResultList;
    }

    if (nextIframeOutputs.length > 0) {
      setIframeOutputs((prev) => (isSameIframeOutputs(prev, nextIframeOutputs) ? prev : nextIframeOutputs));
    }

    setStatus(finalRawData.find((item) => item.status === 'RUNNING') ? 'running' : 'idle');

    // 统一转换为渲染数据
    const renderList = newConvertExecutionResultToItemList(finalRawData);

    // 去重并设置最终结果
    setExecutionResultList(removeRepeatKey(renderList));
  }, [
    executionListData,
    firstPageExecutionList,
    workflowId,
    localRunningOutputs,
    addRunningInstanceToStorage,
    removeRunningInstanceFromStorage,
  ]);

  useEffect(() => {
    latestInstanceMetaRef.current.clear();
    pendingInstanceIdsRef.current.clear();
    setUpdateExecutionResultList([]);
    setIframeOutputs([]);
    setLocalRunningOutputs([]);
  }, [workflowId]);

  useEffect(() => {
    const clearPolling = () => {
      if (pollingTimerRef.current) {
        window.clearInterval(pollingTimerRef.current);
        pollingTimerRef.current = undefined;
      }
    };

    if (!workflowId) {
      clearPolling();
      setLocalRunningOutputs([]);
      return;
    }

    const workflowInstances = runningInstanceStorage?.[workflowId];
    const storedInstanceIds = workflowInstances ? Object.keys(workflowInstances) : [];
    if (storedInstanceIds.length === 0) {
      clearPolling();
      setLocalRunningOutputs([]);
      return;
    }

    let disposed = false;
    const fetchStoredInstances = async () => {
      const latestIds = Object.keys(runningInstanceStorage?.[workflowId] ?? {});
      if (disposed) return;
      if (!latestIds.length) {
        setLocalRunningOutputs([]);
        return;
      }
      const responses = await Promise.all(
        latestIds.map((instanceId) =>
          getWorkflowExecutionSimple(instanceId)
            .then((res) => res)
            .catch(() => null),
        ),
      );
      if (disposed) return;

      const validItems = responses.filter((it): it is VinesWorkflowExecutionOutputListItem => Boolean(it));
      setLocalRunningOutputs(validItems);

      const finalItems = validItems.filter((item) => FINAL_STATUSES.has(item.status));
      if (finalItems.length) {
        finalItems.forEach((item) => removeRunningInstanceFromStorage(workflowId, item.instanceId));
        setIframeOutputs((prev) => (isSameIframeOutputs(prev, finalItems) ? prev : finalItems));
      }
    };

    void fetchStoredInstances();
    clearPolling();
    pollingTimerRef.current = window.setInterval(fetchStoredInstances, 10 * 1000);

    return () => {
      disposed = true;
      clearPolling();
    };
  }, [workflowId, runningInstanceStorage, removeRunningInstanceFromStorage]);

  const setImages = useSetExecutionImages();
  const setThumbImages = useSetThumbImages();
  // filter results for image detail route
  useEffect(() => {
    const allImages = executionResultList.filter((item) => item.render.type.toLowerCase() === 'image');
    // const filerMap = new Map<string, any>();
    const thumbImages: ImagesResult[] = [];
    for (const image of allImages) {
      const url = image.render.data as string;
      const thumbUrl = getThumbUrl(url, enableSystemImageThumbnail);
      thumbImages.push({ ...image, render: { ...image.render, data: thumbUrl } } as ImagesResult);
    }
    setImages(allImages as ImagesResult[]);
    setThumbImages(thumbImages);
  }, [executionResultList, setImages, setThumbImages]);

  useVinesIframeMessage({
    outputs: iframeOutputs,
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
    <Card className={cn(`relative rounded-lg !border-none bg-neocard !shadow-none`, className)}>
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
              {showErrorFilter && <ErrorFilter />}
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
              className={`z-20 mr-0.5 rounded-lg bg-neocard [&>[data-radix-scroll-area-viewport]]:p-2`}
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
