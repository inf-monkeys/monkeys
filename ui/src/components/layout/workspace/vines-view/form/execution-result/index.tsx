import React, { useEffect, useState } from 'react';

import { useCreation } from 'ahooks';
import { type EventEmitter } from 'ahooks/lib/useEventEmitter';
import { AnimatePresence, motion } from 'framer-motion';
import { History } from 'lucide-react';
import { useTranslation } from 'react-i18next';

import { useWorkflowExecutionOutputs } from '@/apis/workflow/execution';
import { VirtuaExecutionResultGrid } from '@/components/layout/workspace/vines-view/form/execution-result/virtua';
import { IVinesExecutionResultItem } from '@/components/layout/workspace/vines-view/form/execution-result/virtua/item';
import { Card, CardContent } from '@/components/ui/card.tsx';
import { VinesImageGroup } from '@/components/ui/image';
import { Label } from '@/components/ui/label.tsx';
import { VinesLoading } from '@/components/ui/loading';
import { useFlowStore } from '@/store/useFlowStore';
import { useViewStore } from '@/store/useViewStore';
import { cn } from '@/utils';
import { stringify } from '@/utils/fast-stable-stringify.ts';

const EMPTY_ITEM: IVinesExecutionResultItem = {
  tasks: [],
  originTasks: [],
  render: { type: 'empty', data: '' },
};

interface IVinesExecutionResultProps extends React.ComponentPropsWithoutRef<'div'> {
  event$: EventEmitter<void>;
  height: number;

  enablePostMessage?: boolean;
}

export const VinesExecutionResult: React.FC<IVinesExecutionResultProps> = ({
  className,
  event$,
  height,
  enablePostMessage,
}) => {
  const { t } = useTranslation();

  const visible = useViewStore((s) => s.visible);
  const workflowId = useFlowStore((s) => s.workflowId);

  const { data: output, isLoading, mutate } = useWorkflowExecutionOutputs(workflowId && visible ? workflowId : null);

  const [refresh, setRefresh] = useState(0);

  const list = useCreation(() => {
    const result: IVinesExecutionResultItem[][] = [[]];

    let rowIndex = 0;
    const insertData = (data: IVinesExecutionResultItem) => {
      if (result[rowIndex].length === 3) {
        result.push([]);
        rowIndex++;
      }

      const currentRow = result[rowIndex];

      if (data.render.type === 'json' || data.render.type === 'text') {
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

    for (const execution of output ?? []) {
      const { output: executionOutput, rawOutput, ...rest } = execution;

      for (const it of executionOutput) {
        insertData({
          ...rest,
          output: rawOutput,
          render: it,
        } as unknown as IVinesExecutionResultItem);
      }
    }

    return result.filter((it) => it.length).map((it) => it.filter((it) => it.render.type !== 'empty'));
  }, [output, refresh]);

  useEffect(() => {
    if (enablePostMessage && output) {
      window.parent.postMessage(
        stringify(output.filter(({ status }) => ['COMPLETED', 'RUNNING'].includes(status))),
        '*',
      );
    }
  }, [enablePostMessage, output]);

  useEffect(() => {
    window.addEventListener('message', (event) => {
      switch (event.data) {
        case 'vines-get-execution-outputs':
          void mutate();
          break;
      }
    });
  }, []);

  event$.useSubscription(() => setRefresh((it) => it + 1));

  const totalCount = list.length;

  return (
    <Card className={cn('relative', className)}>
      <CardContent className="p-0">
        <VinesImageGroup>
          <VirtuaExecutionResultGrid data={list} height={height} />
        </VinesImageGroup>

        <AnimatePresence>
          {isLoading ? (
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
          ) : totalCount ? null : (
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
        </AnimatePresence>
      </CardContent>
    </Card>
  );
};
