import React, { useEffect, useState } from 'react';

import dayjs from 'dayjs';
import { CheckCircle, CircleDashed, CircleSlash, PauseCircle, PlayCircle, TimerOff, XCircle } from 'lucide-react';
import { useTranslation } from 'react-i18next';

import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { useInterval } from '@/hooks/use-interval.ts';
import { VinesWorkflowExecutionType } from '@/package/vines-flow/core/typings.ts';
import { cn } from '@/utils';

interface IExecutionTimerProps {
  status: VinesWorkflowExecutionType;
  startTime: number;
  endTime: number;
  onClick: () => void;
  className?: string;
}

export const ExecutionTimer: React.FC<IExecutionTimerProps> = ({ status, startTime, endTime, onClick, className }) => {
  const { t } = useTranslation();

  const [execTime, setExecTime] = useState<string>('--:--:--');

  const handleUpdateTimeUseStartTime = () => {
    startTime && setExecTime(dayjs.utc(dayjs().diff(startTime)).format('HH:mm:ss'));
  };
  const { start, stop } = useInterval(handleUpdateTimeUseStartTime, 1000);

  useEffect(() => {
    !endTime && handleUpdateTimeUseStartTime();
    if (status === 'RUNNING') {
      start();
    } else {
      stop();
      endTime && setTimeout(() => setExecTime(dayjs.utc(dayjs(endTime).diff(startTime)).format('HH:mm:ss')), 1000);
    }
    return () => stop();
  }, [status, startTime, endTime]);

  const isPaused = status === 'PAUSED';

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Button
          className={cn('px-3', className)}
          variant="outline"
          onClick={() => ['RUNNING', 'PAUSED'].includes(status) && onClick()}
          icon={
            status === 'COMPLETED' ? (
              <CheckCircle />
            ) : ['TERMINATED', 'FAILED'].includes(status) ? (
              <XCircle />
            ) : status === 'CANCELED' ? (
              <CircleSlash />
            ) : status === 'TIMED_OUT' ? (
              <TimerOff />
            ) : isPaused ? (
              <PlayCircle />
            ) : status === 'RUNNING' ? (
              <PauseCircle />
            ) : (
              <CircleDashed />
            )
          }
        >
          {isPaused ? t('workspace.flow-view.execution.timer.paused') : execTime}
        </Button>
      </TooltipTrigger>
      <TooltipContent side="bottom">
        {t('workspace.flow-view.execution.timer.workflow', {
          status:
            status === 'COMPLETED'
              ? t('workspace.flow-view.execution.timer.completed')
              : status === 'TERMINATED'
                ? t('workspace.flow-view.execution.timer.terminated')
                : status === 'FAILED'
                  ? t('workspace.flow-view.execution.timer.failed')
                  : status === 'CANCELED'
                    ? t('workspace.flow-view.execution.timer.canceled')
                    : status === 'TIMED_OUT'
                      ? t('workspace.flow-view.execution.timer.timed-out')
                      : status === 'PAUSED'
                        ? t('workspace.flow-view.execution.timer.paused-and-restart')
                        : status === 'RUNNING'
                          ? t('workspace.flow-view.execution.timer.running')
                          : t('workspace.flow-view.execution.timer.default'),
        })}
      </TooltipContent>
    </Tooltip>
  );
};
