import React, { memo } from 'react';

import { AnimatePresence, motion } from 'framer-motion';
import { useTranslation } from 'react-i18next';

import { VinesActuatorDetailContent } from '@/components/layout/workspace/vines-view/_common/actuator/detail/content';
import { VinesActuatorDetailHeader } from '@/components/layout/workspace/vines-view/_common/actuator/detail/header.tsx';
import { Label } from '@/components/ui/label.tsx';
import { useElementSize } from '@/hooks/use-resize-observer.ts';
import { VinesNodeExecutionTask } from '@/package/vines-flow/core/nodes/typings.ts';

interface IVinesActuatorDetailProps {
  executionTask?: VinesNodeExecutionTask;
  height?: number;
}

export const VinesActuatorDetail: React.FC<IVinesActuatorDetailProps> = memo(({ executionTask, height }) => {
  const { t } = useTranslation();
  const { ref, height: headerHeight } = useElementSize();

  return (
    <AnimatePresence mode="popLayout">
      {executionTask ? (
        <motion.div
          key="vines-actuator-detail-main"
          className="flex h-full flex-1 flex-col gap-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          <VinesActuatorDetailHeader
            ref={ref}
            executionStartTime={executionTask?.startTime}
            executionEndTime={executionTask?.endTime}
            iteration={executionTask?.iteration}
          />
          <VinesActuatorDetailContent
            executionTask={executionTask}
            height={height ? height - 16 - headerHeight : 328}
          />
        </motion.div>
      ) : (
        <motion.div
          key="vines-actuator-detail-empty"
          className="vines-center flex w-full flex-1"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1, transition: { delay: 0.25 } }}
          exit={{ opacity: 0 }}
        >
          <Label className="text-sm">{t('workspace.pre-view.actuator.detail.empty')}</Label>
        </motion.div>
      )}
    </AnimatePresence>
  );
});

VinesActuatorDetail.displayName = 'VinesActuatorDetail';
