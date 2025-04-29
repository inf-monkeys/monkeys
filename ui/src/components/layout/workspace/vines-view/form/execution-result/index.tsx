import React, { useRef } from 'react';

import { type EventEmitter } from 'ahooks/lib/useEventEmitter';
import { AnimatePresence, motion } from 'framer-motion';
import { History } from 'lucide-react';
import { useTranslation } from 'react-i18next';

import { useWorkflowExecutionOutputs } from '@/apis/workflow/execution';
import { MasonryExecutionResultGrid } from '@/components/layout/workspace/vines-view/form/execution-result/execution-result.tsx';
import { useVinesIframeMessage } from '@/components/layout/workspace/vines-view/form/execution-result/iframe-message.ts';
import { useVinesExecutionResult } from '@/components/layout/workspace/vines-view/form/execution-result/use-vines-execution-result.ts';
import { Card, CardContent } from '@/components/ui/card.tsx';
import { Label } from '@/components/ui/label.tsx';
import { VinesLoading } from '@/components/ui/loading';
import { useForceUpdate } from '@/hooks/use-force-update.ts';
import { useFlowStore } from '@/store/useFlowStore';
import { useViewStore } from '@/store/useViewStore';
import { cn } from '@/utils';
import { useSize } from 'ahooks';

interface IVinesExecutionResultProps extends React.ComponentPropsWithoutRef<'div'> {
  event$: EventEmitter<void>;
  height: number;

  enablePostMessage?: boolean;
  isMiniFrame?: boolean;
}

export const LOAD_LIMIT = 22;

export const VinesExecutionResult: React.FC<IVinesExecutionResultProps> = ({
  className,
  event$,
  height,
  enablePostMessage,
  isMiniFrame,
}) => {
  const { t } = useTranslation();

  const visible = useViewStore((s) => s.visible);
  const storeWorkflowId = useFlowStore((s) => s.workflowId);
  const workflowId = storeWorkflowId && visible ? storeWorkflowId : null;

  const { data, isLoading, mutate } = useWorkflowExecutionOutputs(workflowId, 1, LOAD_LIMIT);

  const outputs = data?.data ?? [];
  const totalCount = outputs.length;

  const { conversionOutputs } = useVinesExecutionResult();

  useVinesIframeMessage({ outputs, mutate, enable: enablePostMessage });

  const forceUpdate = useForceUpdate();
  event$.useSubscription(() => forceUpdate());
  const masornyContainer = useRef();
  const masornyContainerSize = useSize(masornyContainer);
  return (
    <Card className={cn('relative', className)}>
      <CardContent className="p-0">
        <MasonryExecutionResultGrid
          data={conversionOutputs(outputs, isMiniFrame ? 2 : 3)}
          isMiniFrame={isMiniFrame}
          total={data?.total ?? 0}
          workflowId={workflowId}
          height={height}
          width={masornyContainerSize?.width ?? 900}
        />
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
          ) : totalCount ? null : (
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
          )}
        </AnimatePresence>
      </CardContent>
    </Card>
  );
};
