import React from 'react';

import { VinesWorkflowExecutionStatData } from '@/apis/workflow/execution/typings.ts';
import { VinesLogViewStatChartCard } from '@/components/layout/workspace/vines-view/log/stat/chart/card.tsx';
import { getI18nContent } from '@/utils';

interface IVinesLogViewStatChartProps {
  searchWorkflowExecutionStatData?: VinesWorkflowExecutionStatData[];
  handleSubmit: () => void;
}

export const VinesLogViewStatChart: React.FC<IVinesLogViewStatChartProps> = ({ searchWorkflowExecutionStatData }) => {
  const statChartConfig = {
    totalCount: {
      label: getI18nContent({
        'zh-CN': '运行总数',
        'en-US': 'Total Count',
      }),
      color: '#87e8de',
    },
    successCount: {
      label: getI18nContent({
        'zh-CN': '运行成功',
        'en-US': 'Success Count',
      }),
      color: '#b7eb8f',
    },
    failedCount: {
      label: getI18nContent({
        'zh-CN': '运行失败',
        'en-US': 'Failed Count',
      }),
      color: '#ffa39e',
    },
    averageTime: {
      label: getI18nContent({
        'zh-CN': '平均用时',
        'en-US': 'Average Time',
      }),
      color: '#ffe58f',
      unit: getI18nContent({
        'zh-CN': '秒',
        'en-US': 's',
      }),
    },
  };
  return (
    searchWorkflowExecutionStatData && (
      <div className="grid grid-cols-[1fr_1fr] gap-4">
        <VinesLogViewStatChartCard
          chartConfig={{ totalCount: statChartConfig['totalCount'] }}
          searchWorkflowExecutionStatData={searchWorkflowExecutionStatData}
        />
        <VinesLogViewStatChartCard
          chartConfig={{ averageTime: statChartConfig['averageTime'] }}
          countCalcType="avg"
          searchWorkflowExecutionStatData={searchWorkflowExecutionStatData}
        />
        <VinesLogViewStatChartCard
          chartConfig={{ successCount: statChartConfig['successCount'] }}
          searchWorkflowExecutionStatData={searchWorkflowExecutionStatData}
        />
        <VinesLogViewStatChartCard
          chartConfig={{ failedCount: statChartConfig['failedCount'] }}
          searchWorkflowExecutionStatData={searchWorkflowExecutionStatData}
        />
      </div>
    )
  );
};
