import React, { forwardRef, useMemo, useState } from 'react';

import { useThrottleEffect } from 'ahooks';
import { type EventEmitter } from 'ahooks/lib/useEventEmitter';
import { AnimatePresence, motion } from 'framer-motion';
import { History } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { GridItemProps, GridListProps, VirtuosoGrid } from 'react-virtuoso';

import { useSearchWorkflowExecutions } from '@/apis/workflow/execution';
import {
  extractImageUrls,
  extractVideoUrls,
} from '@/components/layout/vines-view/execution/data-display/abstract/utils.ts';
import {
  IVinesExecutionResultItem,
  VinesExecutionItemContent,
} from '@/components/layout/vines-view/form/execution-result/item.tsx';
import { Card, CardContent } from '@/components/ui/card.tsx';
import { JSONValue } from '@/components/ui/code-editor';
import { Label } from '@/components/ui/label.tsx';
import { VinesLoading } from '@/components/ui/loading';
import { useFlowStore } from '@/store/useFlowStore';
import { usePageStore } from '@/store/usePageStore';
import { useViewStore } from '@/store/useViewStore';
import { cn } from '@/utils';
import { flattenKeys } from '@/utils/flat.ts';

interface IVinesExecutionResultProps extends React.ComponentPropsWithoutRef<'div'> {
  event$: EventEmitter<void>;
  minimalGap?: boolean;
}

export const VinesExecutionResult: React.FC<IVinesExecutionResultProps> = ({ className, event$, minimalGap }) => {
  const { t } = useTranslation();

  const visible = useViewStore((s) => s.visible);
  const workflowId = useFlowStore((s) => s.workflowId);

  const { data: result, isLoading } = useSearchWorkflowExecutions(
    workflowId && visible
      ? {
          orderBy: { filed: 'startTime', order: 'DESC' },
          pagination: { page: 1, limit: 100 },
          workflowId,
        }
      : null,
  );

  const [refresh, setRefresh] = useState(0);

  const executions = result?.data;
  const list = useMemo(() => {
    const result: IVinesExecutionResultItem[] = [];

    for (const execution of executions ?? []) {
      const output: JSONValue = execution.output ?? {};

      const flattenOutput = flattenKeys(output);
      const outputValues = Object.values(flattenOutput);

      const images = outputValues.map((it) => extractImageUrls(it)).flat();
      const videos = outputValues.map((it) => extractVideoUrls(it)).flat();

      let isInserted = false;

      const outputValuesLength = outputValues.length;
      if (outputValuesLength === 1 && !images.length && !videos.length) {
        result.push({
          ...execution,
          render: { type: 'raw', data: outputValues[0] },
        });
        isInserted = true;
      }

      for (const image of images) {
        result.push({
          ...execution,
          render: { type: 'image', data: image },
        });
        isInserted = true;
      }

      for (const video of videos) {
        result.push({
          ...execution,
          render: { type: 'video', data: video },
        });
        isInserted = true;
      }

      if (!isInserted) {
        result.push({
          ...execution,
          render: { type: 'raw', data: output },
        });
      }
    }

    return result;
  }, [executions, refresh]);

  event$.useSubscription(() => setRefresh((it) => it + 1));

  const containerHeight = usePageStore((s) => s.containerHeight);

  const [height, setHeight] = useState<number>(100);
  useThrottleEffect(
    () => {
      if (!containerHeight) return;
      setHeight(containerHeight - (minimalGap ? 52 : 82));
    },
    [containerHeight, minimalGap],
    { wait: 64 },
  );

  const totalCount = list.length;

  return (
    <Card className={cn('relative', className)}>
      <CardContent className={cn('-mr-3 p-4', minimalGap && 'p-2')}>
        <VirtuosoGrid
          data={list}
          style={{ height }}
          totalCount={totalCount}
          itemContent={VinesExecutionItemContent}
          components={{
            // eslint-disable-next-line react/display-name
            List: forwardRef(
              ({ children, className, ...props }: GridListProps, ref: React.ForwardedRef<HTMLDivElement>) => (
                <div ref={ref} className={cn('flex flex-wrap', className)} {...props}>
                  {children}
                </div>
              ),
            ),
            Item: ({ children, className, ...props }: GridItemProps) => (
              <div
                className={cn('box-border w-1/3 flex-none content-stretch p-3', className, minimalGap && 'p-1')}
                {...props}
              >
                {children}
              </div>
            ),
          }}
        />

        <AnimatePresence>
          {!totalCount && (
            <motion.div
              key="vines-execution-result-empty"
              className="vines-center absolute left-0 top-0 size-full flex-col gap-2"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1, transition: { delay: 0.3 } }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
            >
              <History size={64} />
              <Label className="text-sm">{t('workspace.logs-view.log.list.empty')}</Label>
            </motion.div>
          )}
          {isLoading && (
            <motion.div
              key="vines-execution-result-loading"
              className="vines-center absolute left-0 top-0 size-full"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1, transition: { delay: 0.5 } }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
            >
              <VinesLoading />
            </motion.div>
          )}
        </AnimatePresence>
      </CardContent>
    </Card>
  );
};
