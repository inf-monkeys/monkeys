import React, { useMemo, useState } from 'react';

import { CircularProgress } from '@nextui-org/progress';
import { useMemoizedFn } from 'ahooks';
import { AnimatePresence, motion } from 'framer-motion';
import { VirtuosoGrid } from 'react-virtuoso';

import { useSearchWorkflowExecutions } from '@/apis/workflow/execution';
import {
  extractImageUrls,
  extractVideoUrls,
} from '@/components/layout/vines-view/execution/data-display/abstract/utils.ts';
import { gridComponents } from '@/components/layout/vines-view/form/execution-result/consts.tsx';
import {
  IVinesExecutionResultItem,
  VinesExecutionItemContent,
} from '@/components/layout/vines-view/form/execution-result/item.tsx';
import { Card, CardContent } from '@/components/ui/card.tsx';
import { JSONValue } from '@/components/ui/code-editor';
import { useFlowStore } from '@/store/useFlowStore';
import { useViewStore } from '@/store/useViewStore';
import { flattenKeys } from '@/utils/flat.ts';

interface IVinesExecutionResultProps extends React.ComponentPropsWithoutRef<'div'> {}

export const VinesExecutionResult: React.FC<IVinesExecutionResultProps> = () => {
  const { visible } = useViewStore();
  const { workflowId } = useFlowStore();

  const { data: result, isLoading } = useSearchWorkflowExecutions(
    workflowId && visible
      ? {
          orderBy: { filed: 'startTime', order: 'DESC' },
          pagination: { page: 1, limit: 100 },
          workflowId,
        }
      : null,
  );

  const executions = result?.data;
  const list = useMemo(() => {
    const result: IVinesExecutionResultItem[] = [];

    for (const execution of executions ?? []) {
      const output: JSONValue = execution.output ?? {};

      const flattenOutput = flattenKeys(output);
      const outputValues = Object.values(flattenOutput);

      const images = outputValues.map((it) => extractImageUrls(it)).flat();
      const videos = outputValues.map((it) => extractVideoUrls(it)).flat();

      const outputValuesLength = outputValues.length;
      if (outputValuesLength === 1 && !images.length && !videos.length) {
        result.push({
          ...execution,
          render: { type: 'raw', data: outputValues[0] },
        });
      }

      for (const image of images) {
        result.push({
          ...execution,
          render: { type: 'image', data: image },
        });
      }

      for (const video of videos) {
        result.push({
          ...execution,
          render: { type: 'video', data: video },
        });
      }
    }

    return result;
  }, [executions]);

  const [height, setHeight] = useState<number>(100);
  const ref = useMemoizedFn((node: HTMLDivElement) => {
    if (node) {
      const { height } = node.getBoundingClientRect();
      setHeight(height - 48);
    }
  });

  const totalCount = list.length;

  return (
    <Card ref={ref} className="relative">
      <CardContent className="-mr-3 p-4">
        <VirtuosoGrid
          data={list}
          style={{ height }}
          totalCount={totalCount}
          itemContent={VinesExecutionItemContent}
          components={gridComponents}
        />
      </CardContent>
      <AnimatePresence>
        {isLoading && (
          <motion.div
            className="vines-center absolute left-0 top-0 size-full"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1, transition: { delay: 0.5 } }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
          >
            <CircularProgress className="[&_circle:last-child]:stroke-vines-500" size="lg" aria-label="Loading..." />
          </motion.div>
        )}
      </AnimatePresence>
    </Card>
  );
};
