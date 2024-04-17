import React, { forwardRef, useMemo } from 'react';

import dayjs from 'dayjs';

interface IVinesActuatorDetailHeaderProps {
  executionStartTime?: number;
  executionEndTime?: number;
  iteration?: number;
}

export const VinesActuatorDetailHeader = forwardRef<HTMLHeadingElement, IVinesActuatorDetailHeaderProps>(
  ({ executionStartTime = 0, executionEndTime = 0, iteration = 0 }, ref) => {
    const startTime = executionStartTime ? dayjs(executionStartTime).format('YYYY-MM-DD HH:mm:ss') : '-';
    const endTime = executionEndTime ? dayjs(executionEndTime).format('YYYY-MM-DD HH:mm:ss') : '-';
    const currentDuration = useMemo(() => {
      const duration = dayjs.duration(dayjs(executionEndTime).diff(dayjs(executionStartTime)));
      const days = duration.days();
      const hours = duration.hours();
      const minutes = duration.minutes();
      const seconds = duration.seconds();
      const milliseconds = duration.milliseconds();
      if (days > 0) return `${days} 天`;
      if (hours > 0) return `${hours} 小时`;
      if (minutes > 0) return `${minutes} 分钟`;
      if (seconds > 0) return `${seconds} 秒`;
      if (milliseconds > 0) return `${milliseconds} 毫秒`;
      return '-';
    }, [executionStartTime, executionEndTime]);

    return (
      <header ref={ref} className="flex shrink-0 grow-0 flex-wrap text-xs text-gray-10">
        <p className="mr-4">开始时间：{startTime}</p>
        <p className="mr-4">结束时间：{endTime}</p>
        <p className="mr-4">运行时长：{currentDuration}</p>
        {iteration ? <p className="mr-4">迭代轮次：{iteration}</p> : null}
      </header>
    );
  },
);

VinesActuatorDetailHeader.displayName = 'VinesActuatorDetailHeader';
