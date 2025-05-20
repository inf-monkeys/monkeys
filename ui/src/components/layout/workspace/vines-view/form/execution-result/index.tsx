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
import { useForceUpdate } from '@/hooks/use-force-update.ts';
import { ImagesResult, useExecutionImageResultStore } from '@/store/useExecutionImageResultStore';
import { useFlowStore } from '@/store/useFlowStore';
import { useViewStore } from '@/store/useViewStore';
import { cn } from '@/utils';
import {
  concatResultListReducer,
  convertExecutionResultToItemList,
  IVinesExecutionResultItem,
} from '@/utils/execution.ts';

import { useVinesIframeMessage } from './iframe-message';

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

  useEffect(() => {
    if (!executionListData || executionListData.length == 0 || executionListData[0]?.total == 0) return;
    const list: IVinesExecutionResultItem[] = [];
    for (const execution of executionListData ?? []) {
      if (execution && execution.data)
        list.push(...execution.data.map(convertExecutionResultToItemList).reduce(concatResultListReducer, []));
    }
    setExecutionResultList(list);
  }, [executionListData]);

  // 第一页任务及状态变化
  useEffect(() => {
    // 筛选状态变更的替换原 result
    const changed = firstPageExecutionList.filter(
      (r) =>
        executionResultList.findIndex(
          (pr) => r.instanceId === pr.instanceId && r.status != pr.status && !pr.render.isDeleted,
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
  // filter results for image detail route
  useEffect(() => {
    const images = executionResultList.filter((item) => item.render.type.toLowerCase() === 'image');
    setImages(images as ImagesResult[]);
  }, [executionResultList, setImages]);

  useVinesIframeMessage({
    outputs: executionResultList,
    mutate: mutateExecutionList,
    enable: enablePostMessage,
  });

  return (
    <Card className={cn('relative bg-card-light dark:bg-card-dark', className)}>
      <CardContent className="p-0">
        {executionResultList && executionResultList.length && !isLoading ? (
          <ExecutionResultGrid
            workflowId={workflowId}
            height={height}
            setPage={setCurrentPage}
            data={executionResultList}
            hasMore={hasMore}
            event$={event$}
            mutate={mutateExecutionList}
          />
        ) : null}
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
