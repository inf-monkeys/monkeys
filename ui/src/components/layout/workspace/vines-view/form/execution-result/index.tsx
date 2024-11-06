import React, { useState } from 'react';

import { useCreation } from 'ahooks';
import { type EventEmitter } from 'ahooks/lib/useEventEmitter';
import { AnimatePresence, motion } from 'framer-motion';
import { History } from 'lucide-react';
import { useTranslation } from 'react-i18next';

import { useWorkflowExecutionOutputs } from '@/apis/workflow/execution';
import { useVinesIframeMessage } from '@/components/layout/workspace/vines-view/form/execution-result/iframe-message.ts';
import { VirtuaExecutionResultGrid } from '@/components/layout/workspace/vines-view/form/execution-result/virtua';
import { IVinesExecutionResultItem } from '@/components/layout/workspace/vines-view/form/execution-result/virtua/item';
import { Card, CardContent } from '@/components/ui/card.tsx';
import { VinesImageGroup } from '@/components/ui/image';
import { Label } from '@/components/ui/label.tsx';
import { VinesLoading } from '@/components/ui/loading';
import { useFlowStore } from '@/store/useFlowStore';
import { useViewStore } from '@/store/useViewStore';
import { cn } from '@/utils';

const EMPTY_ITEM: IVinesExecutionResultItem = {
  tasks: [],
  originTasks: [],
  render: { type: 'empty', data: '' },
};

interface IVinesExecutionResultProps extends React.ComponentPropsWithoutRef<'div'> {
  event$: EventEmitter<void>;
  height: number;

  enablePostMessage?: boolean;
  isMiniFrame?: boolean;
}

export const VinesExecutionResult: React.FC<IVinesExecutionResultProps> = ({
  className,
  event$,
  height,
  enablePostMessage,
  isMiniFrame,
}) => {
  const { t } = useTranslation();

  const visible = useViewStore((s) => s.visible);
  const workflowId = useFlowStore((s) => s.workflowId);

  const { data: output, isLoading, mutate } = useWorkflowExecutionOutputs(workflowId && visible ? workflowId : null);

  const [refresh, setRefresh] = useState(0);

  const list = useCreation(() => {
    const result: IVinesExecutionResultItem[][] = [];
    let currentRow: IVinesExecutionResultItem[] = [];
    const col = isMiniFrame ? 2 : 3;

    for (const execution of output ?? []) {
      const { output: executionOutput, rawOutput, ...rest } = execution;

      for (const it of executionOutput) {
        const data = {
          ...rest,
          output: rawOutput,
          render: it,
        } as unknown as IVinesExecutionResultItem;

        const isTextOrJson = data.render.type === 'json' || data.render.type === 'text';

        if (isTextOrJson) {
          if (currentRow.length > 0) {
            // 填充当前行并添加到结果中
            currentRow = currentRow.concat(new Array(col - currentRow.length).fill(EMPTY_ITEM));
            result.push(currentRow);
            currentRow = [];
          }
          // 创建新行并填充空白项
          const newRow = [data].concat(new Array(col - 1).fill(EMPTY_ITEM));
          result.push(newRow);
        } else {
          if (currentRow.length >= col) {
            result.push(currentRow);
            currentRow = [];
          }
          currentRow.push(data);
        }
      }
    }

    // 添加剩余的当前行
    if (currentRow.length > 0) {
      result.push(currentRow);
    }

    return result.map((row) => row.filter((item) => item.render.type !== 'empty'));
  }, [output, refresh, isMiniFrame]);

  useVinesIframeMessage({ output, mutate, enable: enablePostMessage });

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
