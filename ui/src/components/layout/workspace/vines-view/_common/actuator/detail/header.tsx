import React, { forwardRef, useMemo } from 'react';

import dayjs from 'dayjs';
import { useTranslation } from 'react-i18next';

interface IVinesActuatorDetailHeaderProps {
  executionStartTime?: number;
  executionEndTime?: number;
  iteration?: number;
}

export const VinesActuatorDetailHeader = forwardRef<HTMLHeadingElement, IVinesActuatorDetailHeaderProps>(
  ({ executionStartTime = 0, executionEndTime = 0, iteration = 0 }, ref) => {
    const { t } = useTranslation();

    const startTime = executionStartTime ? dayjs(executionStartTime).format('YYYY-MM-DD HH:mm:ss') : '-';
    const endTime = executionEndTime ? dayjs(executionEndTime).format('YYYY-MM-DD HH:mm:ss') : '-';
    const currentDuration = useMemo(() => {
      const duration = dayjs.duration(dayjs(executionEndTime).diff(dayjs(executionStartTime)));
      const days = duration.days();
      const hours = duration.hours();
      const minutes = duration.minutes();
      const seconds = duration.seconds();
      const milliseconds = duration.milliseconds();
      if (days > 0) return t('workspace.pre-view.actuator.detail.header.days', { days });
      if (hours > 0) return t('workspace.pre-view.actuator.detail.header.hours', { hours });
      if (minutes > 0) return t('workspace.pre-view.actuator.detail.header.minutes', { minutes });
      if (seconds > 0) return t('workspace.pre-view.actuator.detail.header.seconds', { seconds });
      if (milliseconds > 0) return t('workspace.pre-view.actuator.detail.header.milliseconds', { milliseconds });
      return '-';
    }, [executionStartTime, executionEndTime]);

    return (
      <header ref={ref} className="flex shrink-0 grow-0 flex-wrap text-xs text-gray-10">
        <p className="mr-4">{t('workspace.pre-view.actuator.detail.header.start-time', { startTime })}</p>
        <p className="mr-4">{t('workspace.pre-view.actuator.detail.header.end-time', { endTime })}</p>
        <p className="mr-4">{t('workspace.pre-view.actuator.detail.header.duration', { currentDuration })}</p>
        {iteration ? (
          <p className="mr-4">{t('workspace.pre-view.actuator.detail.header.iteration', { iteration })}</p>
        ) : null}
      </header>
    );
  },
);

VinesActuatorDetailHeader.displayName = 'VinesActuatorDetailHeader';
