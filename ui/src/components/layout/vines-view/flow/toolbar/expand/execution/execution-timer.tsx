import React, { useEffect, useState } from 'react';

import { useInterval } from '@mantine/hooks';
import dayjs from 'dayjs';
import { CheckCircle, CircleDashed, CircleSlash, PauseCircle, PlayCircle, TimerOff, XCircle } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
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
          {isPaused ? '已暂停' : execTime}
        </Button>
      </TooltipTrigger>
      <TooltipContent side="bottom">
        工作流
        {status === 'COMPLETED'
          ? '已完成运行'
          : status === 'TERMINATED'
            ? '已终止运行'
            : status === 'FAILED'
              ? '运行失败'
              : status === 'CANCELED'
                ? '已取消运行'
                : status === 'TIMED_OUT'
                  ? '运行超时'
                  : status === 'PAUSED'
                    ? '已暂停（点击继续）'
                    : status === 'RUNNING'
                      ? '运行中（点击暂停）'
                      : '上次运行时长'}
      </TooltipContent>
    </Tooltip>
  );
};
