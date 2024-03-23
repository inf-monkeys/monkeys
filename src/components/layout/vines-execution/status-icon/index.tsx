import React, { memo } from 'react';

import { CircularProgress } from '@nextui-org/progress';
import { AnimatePresence, motion } from 'framer-motion';
import { AlertCircle, CheckCircle2, Circle, CircleDashed, CircleSlash, PauseCircle } from 'lucide-react';

import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { VinesNodeExecutionTask } from '@/package/vines-flow/core/nodes/typings.ts';
import { VinesWorkflowExecutionType } from '@/package/vines-flow/core/typings.ts';
import { cn } from '@/utils';

interface IExecutionStatusIconProps {
  className?: string;
  status: VinesNodeExecutionTask['status'];
  workflowStatus: VinesWorkflowExecutionType;
}

export const ExecutionStatusIcon: React.FC<IExecutionStatusIconProps> = memo(
  ({ className, status = '', workflowStatus }) => {
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
                >
                  <CircularProgress
                    className="-mr-4 scale-50 [&_circle:last-child]:stroke-vines-500"
                    size="lg"
                    aria-label="Loading..."
                  />
                </motion.div>
              ) : status === 'COMPLETED' ? (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.2 }}
                >
                  <CheckCircle2 size={20} className="stroke-green-10" />
                </motion.div>
              ) : status === 'CANCELED' ? (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.2 }}
                >
                  <CircleSlash size={20} className="stroke-gray-10" />
                </motion.div>
              ) : ['SKIPPED', 'TIMED_OUT'].includes(status) ? (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.2 }}
                >
                  <Circle size={20} />
                </motion.div>
              ) : ['FAILED', 'FAILED_WITH_TERMINAL_ERROR'].includes(status) ? (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.2 }}
                >
                  <AlertCircle size={20} className="stroke-red-10" />
                </motion.div>
              ) : workflowStatus === 'PAUSED' ? (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.2 }}
                >
                  <PauseCircle size={20} className="stroke-yellow-10" />
                </motion.div>
              ) : workflowStatus !== 'SCHEDULED' ? (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.2 }}
                >
                  <CircleDashed size={20} />
                </motion.div>
              ) : null}
            </AnimatePresence>
          </div>
        </TooltipTrigger>
        <TooltipContent>
          {status === 'COMPLETED'
            ? '运行完毕'
            : status === 'CANCELED'
              ? '已取消'
              : status === 'SKIPPED'
                ? '已跳过'
                : status === 'TIMED_OUT'
                  ? '超时'
                  : status === 'FAILED'
                    ? '失败'
                    : status === 'FAILED_WITH_TERMINAL_ERROR'
                      ? '失败'
                      : status === 'IN_PROGRESS'
                        ? '运行中'
                        : status === 'SCHEDULED'
                          ? '已计划 / 正在运行中'
                          : status === 'RUNNING'
                            ? '运行中'
                            : workflowStatus === 'PAUSED'
                              ? '工作流运行已暂停'
                              : workflowStatus === 'SCHEDULED'
                                ? '已计划，等待工作流运行准备'
                                : '未知状态'}
        </TooltipContent>
      </Tooltip>
    );
  },
);

ExecutionStatusIcon.displayName = 'ExecutionStatusIcon';
