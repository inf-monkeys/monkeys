import React, { useMemo, useState } from 'react';

import { useSetState, useThrottleEffect } from 'ahooks';
import { type EventEmitter } from 'ahooks/lib/useEventEmitter';
import { AnimatePresence, motion } from 'framer-motion';
import { History } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { VariableSizeGrid as Grid } from 'react-window';

import { useSearchWorkflowExecutions } from '@/apis/workflow/execution';
import {
  extractImageUrls,
  extractVideoUrls,
} from '@/components/layout/workspace/vines-view/execution/data-display/abstract/utils.ts';
import {
  IVinesExecutionResultItem,
  VinesExecutionResultItem,
} from '@/components/layout/workspace/vines-view/form/execution-result/item.tsx';
import { Card, CardContent } from '@/components/ui/card.tsx';
import { JSONValue } from '@/components/ui/code-editor';
import { Label } from '@/components/ui/label.tsx';
import { VinesLoading } from '@/components/ui/loading';
import useUrlState from '@/hooks/use-url-state.ts';
import { useFlowStore } from '@/store/useFlowStore';
import { usePageStore } from '@/store/usePageStore';
import { useViewStore } from '@/store/useViewStore';
import { cn } from '@/utils';
import { flattenKeys } from '@/utils/flat.ts';

const EMPTY_ITEM: IVinesExecutionResultItem = {
  tasks: [],
  originTasks: [],
  render: { type: 'empty', data: '' },
};

interface IVinesExecutionResultProps extends React.ComponentPropsWithoutRef<'div'> {
  event$: EventEmitter<void>;
  miniGap?: boolean;
  workbenchGap?: boolean;
}

export const VinesExecutionResult: React.FC<IVinesExecutionResultProps> = ({
  className,
  event$,
  miniGap,
  workbenchGap,
}) => {
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
    const result: IVinesExecutionResultItem[][] = [[]];

    let rowIndex = 0;
    const insertData = (data: IVinesExecutionResultItem) => {
      if (result[rowIndex].length === 3) {
        result.push([]);
        rowIndex++;
      }

      const currentRow = result[rowIndex];

      if (data.render.type === 'raw') {
        if (currentRow.length !== 0) {
          for (let i = 0; i < 4 - currentRow.length; i++) {
            currentRow.push(EMPTY_ITEM);
          }
          result.push([data, EMPTY_ITEM, EMPTY_ITEM]);
          result.push([]);
          rowIndex++;
        } else {
          currentRow.push(data);
          currentRow.push(EMPTY_ITEM);
          currentRow.push(EMPTY_ITEM);
          result.push([]);
          rowIndex++;
        }
      } else {
        const emptyIndex = currentRow.findIndex((it) => it.render.type === 'empty');
        if (emptyIndex !== -1) {
          currentRow[emptyIndex] = data;
        } else {
          currentRow.push(data);
        }
      }
    };

    for (const execution of executions ?? []) {
      const output: JSONValue = execution.output ?? {};

      const flattenOutput = flattenKeys(output);
      const outputValues = Object.values(flattenOutput);

      const images = outputValues.map((it) => extractImageUrls(it)).flat();
      const videos = outputValues.map((it) => extractVideoUrls(it)).flat();

      let isInserted = false;

      const outputValuesLength = outputValues.length;
      if (outputValuesLength === 1 && !images.length && !videos.length) {
        insertData({
          ...execution,
          render: { type: 'raw', data: outputValues[0] },
        });
        isInserted = true;
      }

      for (const image of images) {
        insertData({
          ...execution,
          render: { type: 'image', data: image },
        });
        isInserted = true;
      }

      for (const video of videos) {
        insertData({
          ...execution,
          render: { type: 'video', data: video },
        });
        isInserted = true;
      }

      if (!isInserted) {
        insertData({
          ...execution,
          render: { type: 'raw', data: output },
        });
      }
    }

    return result.flat();
  }, [executions, refresh]);

  event$.useSubscription(() => setRefresh((it) => it + 1));

  const [{ mode }] = useUrlState<{ mode: 'normal' | 'fast' | 'mini' }>({ mode: 'normal' });

  const containerHeight = usePageStore((s) => s.containerHeight);
  const containerWidth = usePageStore((s) => s.containerWidth);

  const [size, setSize] = useSetState({ width: 512, height: 512 });
  const [gridVisible, setGridVisible] = useState(true);
  useThrottleEffect(
    () => {
      if (!containerHeight || !containerWidth) return;
      setSize({
        width: miniGap ? containerWidth - 25 : containerWidth / 2 - (mode === 'fast' ? 140 : 18),
        height: containerHeight - (workbenchGap ? (mode === 'fast' ? 72 : 32) : miniGap ? 84 : 50),
      });
      setGridVisible(false);
      setTimeout(() => setGridVisible(true), 16);
    },
    [containerHeight, containerWidth, miniGap, workbenchGap, mode],
    { wait: 64 },
  );

  const totalCount = list.length;
  const itemSize = size.width / 3;

  return (
    <Card className={cn('relative', className)}>
      <CardContent className="p-0">
        {gridVisible && (
          <Grid
            className="!overflow-x-hidden"
            height={size.height}
            width={size.width}
            columnCount={3}
            columnWidth={() => itemSize}
            rowCount={Math.ceil(totalCount / 3)}
            rowHeight={() => itemSize}
            itemData={list}
          >
            {({ columnIndex, rowIndex, style: { width, ...style }, data }) => {
              const item = data[rowIndex * 3 + columnIndex];
              const type = item?.render?.type;
              if (!item || type === 'empty') return null;
              return (
                <div style={{ ...style, width: type === 'raw' ? size.width : width }}>
                  <VinesExecutionResultItem data={item} height={itemSize - 16} />
                </div>
              );
            }}
          </Grid>
        )}

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
