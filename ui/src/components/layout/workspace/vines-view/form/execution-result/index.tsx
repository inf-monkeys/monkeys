import React, { useState } from 'react';

import { useCreation } from 'ahooks';
import { type EventEmitter } from 'ahooks/lib/useEventEmitter';
import { AnimatePresence, motion } from 'framer-motion';
import { History } from 'lucide-react';
import { useTranslation } from 'react-i18next';

import { useSearchWorkflowExecutions } from '@/apis/workflow/execution';
import {
  extractImageUrls,
  extractVideoUrls,
} from '@/components/layout/workspace/vines-view/_common/data-display/abstract/utils.ts';
import { VirtuaExecutionResultGrid } from '@/components/layout/workspace/vines-view/form/execution-result/virtua';
import { IVinesExecutionResultItem } from '@/components/layout/workspace/vines-view/form/execution-result/virtua/item';
import { Card, CardContent } from '@/components/ui/card.tsx';
import { JSONValue } from '@/components/ui/code-editor';
import { VinesImageGroup } from '@/components/ui/image';
import { Label } from '@/components/ui/label.tsx';
import { VinesLoading } from '@/components/ui/loading';
import { useFlowStore } from '@/store/useFlowStore';
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
  height: number;
}

export const VinesExecutionResult: React.FC<IVinesExecutionResultProps> = ({ className, event$, height }) => {
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
  const list = useCreation(() => {
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

    return result.filter((it) => it.length).map((it) => it.filter((it) => it.render.type !== 'empty'));
  }, [executions, refresh]);

  event$.useSubscription(() => setRefresh((it) => it + 1));

  const totalCount = list.length;

  return (
    <Card className={cn('relative', className)}>
      <CardContent className="p-0">
        <VinesImageGroup>
          <VirtuaExecutionResultGrid data={list} height={height} />
        </VinesImageGroup>

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
