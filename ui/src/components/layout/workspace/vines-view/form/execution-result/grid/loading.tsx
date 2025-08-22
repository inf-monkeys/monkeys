import { useMemo, useState } from 'react';

import { useTranslation } from 'react-i18next';

import { Progress } from '@/components/ui/progress';
import { useInterval } from '@/hooks/use-interval';

interface IExecutionResultItemLoadingProps {
  startTime: number;
  estimatedTime: number;
  status: string;
}

export const ExecutionResultItemLoading = ({ startTime, estimatedTime, status }: IExecutionResultItemLoadingProps) => {
  const { t } = useTranslation();

  // 添加当前时间状态
  const [currentTime, setCurrentTime] = useState(Date.now());

  // 计算预估进度
  const estimatedProgress = useMemo(() => {
    if (!startTime || !estimatedTime || !['RUNNING', 'SCHEDULED'].includes(status)) {
      return 0;
    }

    const elapsed = (currentTime - startTime) / 1000;
    const progress = Math.min((elapsed / estimatedTime) * 100, 90);

    return Math.max(0, progress);
  }, [startTime, estimatedTime, status, currentTime]);

  // 使用 useInterval 每秒更新当前时间
  useInterval(
    () => {
      setCurrentTime(Date.now());
    },
    1000,
    {
      autoInvoke: true,
    },
  );

  return (
    <div className="w-full space-y-2">
      <div className="flex items-center justify-between text-xs text-muted-foreground">
        <span>{t('common.workflow.status.RUNNING')}</span>
        <span>{estimatedProgress.toFixed(1)} %</span>
      </div>
      <Progress value={estimatedProgress} className="h-2" />
    </div>
  );
};
