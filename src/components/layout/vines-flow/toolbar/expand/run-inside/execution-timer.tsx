import React, { useEffect, useState } from 'react';

import { useInterval } from '@mantine/hooks';
import { CheckCircle, CircleDashed, CircleSlash, PauseCircle, PlayCircle, TimerOff, XCircle } from 'lucide-react';
import moment from 'moment';

import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { VinesWorkflowExecutionType } from '@/package/vines-flow/core/typings.ts';

interface IExecutionTimerProps {
  status: VinesWorkflowExecutionType;
  startTime: number;
  endTime: number;
  onClick: () => void;
}

export const ExecutionTimer: React.FC<IExecutionTimerProps> = ({ status, startTime, endTime, onClick }) => {
  const [execTime, setExecTime] = useState<string>('--:--:--');

  const handleUpdateTimeUseStartTime = () => {
    startTime && setExecTime(moment.utc(moment().diff(startTime)).format('HH:mm:ss'));
  };
  const { start, stop } = useInterval(handleUpdateTimeUseStartTime, 1000);

  useEffect(() => {
    !endTime && handleUpdateTimeUseStartTime();
    if (status === 'RUNNING') {
      start();
    } else {
      stop();
      endTime && setTimeout(() => setExecTime(moment.utc(moment(endTime).diff(startTime)).format('HH:mm:ss')), 1000);
    }
    return () => stop();
  }, [status, startTime, endTime]);

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Button
          className="px-3"
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
            ) : status === 'PAUSED' ? (
              <PlayCircle />
            ) : status === 'RUNNING' ? (
              <PauseCircle />
            ) : (
              <CircleDashed />
            )
          }
        >
          {execTime}
        </Button>
      </TooltipTrigger>
      <TooltipContent>
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
