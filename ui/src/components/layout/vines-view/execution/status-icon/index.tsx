import React, { memo } from 'react';

import { AnimatePresence, motion } from 'framer-motion';
import { AlertCircle, CheckCircle2, Circle, CircleDashed, CircleSlash, PauseCircle } from 'lucide-react';

import { getExecutionStatusText } from '@/components/layout/vines-view/execution/status-icon/utils.ts';
import { VinesLoading } from '@/components/ui/loading';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { VinesNodeExecutionTask } from '@/package/vines-flow/core/nodes/typings.ts';
import { VinesWorkflowExecutionType } from '@/package/vines-flow/core/typings.ts';
import { cn } from '@/utils';

interface IExecutionStatusIconProps {
  className?: string;
  size?: number;
  status: VinesNodeExecutionTask['status'] | string;
  workflowStatus: VinesWorkflowExecutionType | string;
  spinClassName?: string;
}

export const ExecutionStatusIcon: React.FC<IExecutionStatusIconProps> = memo(
  ({ className, status = '', workflowStatus, size = 20, spinClassName }) => {
    return (
      <Tooltip>
        <TooltipTrigger asChild>
          <div className={cn('vines-center relative', className)}>
            <AnimatePresence>
              {['IN_PROGRESS', 'SCHEDULED', 'RUNNING'].includes(status) && workflowStatus === 'RUNNING' ? (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.2 }}
                  className="flex"
                  style={{ width: size, height: size }}
                >
                  <VinesLoading />
                </motion.div>
              ) : status === 'COMPLETED' ? (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.2 }}
                >
                  <CheckCircle2 size={size} className="stroke-green-10" />
                </motion.div>
              ) : ['CANCELED', 'TERMINATED'].includes(status) ? (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.2 }}
                >
                  <CircleSlash size={size} className="stroke-gray-10" />
                </motion.div>
              ) : ['SKIPPED', 'TIMED_OUT'].includes(status) ? (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.2 }}
                >
                  <Circle size={size} />
                </motion.div>
              ) : ['FAILED', 'FAILED_WITH_TERMINAL_ERROR'].includes(status) ? (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.2 }}
                >
                  <AlertCircle size={size} className="stroke-red-10" />
                </motion.div>
              ) : workflowStatus === 'PAUSED' ? (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.2 }}
                >
                  <PauseCircle size={size} className="stroke-yellow-10" />
                </motion.div>
              ) : workflowStatus !== 'SCHEDULED' ? (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.2 }}
                >
                  <CircleDashed size={size} />
                </motion.div>
              ) : null}
            </AnimatePresence>
          </div>
        </TooltipTrigger>
        <TooltipContent>{getExecutionStatusText(status, workflowStatus)}</TooltipContent>
      </Tooltip>
    );
  },
);

ExecutionStatusIcon.displayName = 'ExecutionStatusIcon';
