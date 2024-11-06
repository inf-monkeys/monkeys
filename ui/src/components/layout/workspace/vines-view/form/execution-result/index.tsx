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
    const result: IVinesExecutionResultItem[][] = [[]];

    let rowIndex = 0;
    const insertData = (data: IVinesExecutionResultItem, col = 3) => {
      const currentRow = result[rowIndex];
      const isTextOrJson = data.render.type === 'json' || data.render.type === 'text';

      // 如果当前行已满,创建新行
      if (currentRow.length >= col) {
        result.push([]);
        rowIndex++;
      }

      // 文本类型数据处理
      if (isTextOrJson) {
        const emptyItems = new Array(col - 1).fill(EMPTY_ITEM);

        if (currentRow.length) {
          // 当前行非空,填充当前行并创建新行
          currentRow.push(...new Array(col - currentRow.length).fill(EMPTY_ITEM));
          result.push([data, ...emptyItems]);
        } else {
          // 当前行为空,直接使用
          currentRow.push(data, ...emptyItems);
        }

        result.push([]);
        rowIndex++;
        return;
      }

      // 非文本类型数据处理
      const emptyIndex = currentRow.findIndex((it) => it.render.type === 'empty');
      if (emptyIndex !== -1) {
        currentRow[emptyIndex] = data;
      } else {
        currentRow.push(data);
      }
    };

    for (const execution of output ?? []) {
      const { output: executionOutput, rawOutput, ...rest } = execution;

      for (const it of executionOutput) {
        insertData(
          {
            ...rest,
            output: rawOutput,
            render: it,
          } as unknown as IVinesExecutionResultItem,
          isMiniFrame ? 1 : 3,
        );
      }
    }

    return result.filter((it) => it.length).map((it) => it.filter((it) => it.render.type !== 'empty'));
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
