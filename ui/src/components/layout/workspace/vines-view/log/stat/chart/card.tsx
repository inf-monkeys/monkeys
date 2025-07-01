import React, { useMemo } from 'react';

import { LineChart } from 'echarts/charts';
import { GridComponent, MarkLineComponent, TooltipComponent, VisualMapComponent } from 'echarts/components';
import * as echarts from 'echarts/core';
import { CanvasRenderer } from 'echarts/renderers';
import ReactECharts from 'echarts-for-react';

import { VinesWorkflowExecutionStatData } from '@/apis/workflow/execution/typings.ts';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card.tsx';
import { cn } from '@/utils';

// 注册 ECharts 必要组件
echarts.use([TooltipComponent, GridComponent, VisualMapComponent, LineChart, CanvasRenderer, MarkLineComponent]);

export type IVinesLogViewStatChartConfig = Record<string, any> & {
  unit?: string;
};

export interface IVinesLogViewStatChartCardProps {
  searchWorkflowExecutionStatData: VinesWorkflowExecutionStatData[];
  chartConfig: IVinesLogViewStatChartConfig;
  countCalcType?: 'sum' | 'avg';
}

export const VinesLogViewStatChartCard: React.FC<IVinesLogViewStatChartCardProps> = ({
  searchWorkflowExecutionStatData,
  chartConfig,
  countCalcType = 'sum',
}) => {
  const count: number =
    (countCalcType === 'avg'
      ? searchWorkflowExecutionStatData
          .map((d) => d[Object.keys(chartConfig)[0]])
          .reduce((accumulator, currentValue) => accumulator + currentValue, 0) /
        (searchWorkflowExecutionStatData.map((d) => d[Object.keys(chartConfig)[0]]).filter((data) => data != 0)
          .length ?? 1)
      : searchWorkflowExecutionStatData
          .map((d) => d[Object.keys(chartConfig)[0]])
          .reduce((accumulator, currentValue) => accumulator + currentValue, 0)) || 0;

  const chartOption = useMemo(() => {
    const seriesKeys = Object.keys(chartConfig).filter((key) => key !== 'unit');

    const option = {
      tooltip: {
        trigger: 'axis',
        axisPointer: {
          type: 'line',
        },
      },
      grid: {
        left: '0%',
        right: '2%',
        bottom: '0%',
        containLabel: true,
      },
      xAxis: {
        type: 'category',
        boundaryGap: false,
        data: searchWorkflowExecutionStatData.map((d) => d.date),
        show: true,
        axisLine: { show: false },
        axisTick: { show: false },
      },
      yAxis: {
        type: 'value',
        splitLine: {
          lineStyle: {
            type: 'dashed',
            color: '#ccc',
          },
        },
        axisLabel: { show: false },
      },
      series: seriesKeys.map((key) => {
        const seriesConfig = chartConfig[key];
        return {
          name: seriesConfig.label,
          type: 'line',
          smooth: true,
          showSymbol: false,
          stack: 'total',
          data: searchWorkflowExecutionStatData.map((d) => d[key]),
          itemStyle: {
            color: seriesConfig.color,
          },

          areaStyle: {
            color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
              {
                offset: 0,
                color: seriesConfig.color,
              },
              {
                offset: 1,
                color: 'rgba(255, 255, 255, 0)',
              },
            ]),
            opacity: 0.5,
          },
        };
      }),
    };

    return option;
  }, [searchWorkflowExecutionStatData, chartConfig]);

  return (
    <Card>
      <CardHeader>
        <CardTitle>{chartConfig[Object.keys(chartConfig)[0]]['label']}</CardTitle>
        <CardDescription>{`${searchWorkflowExecutionStatData[0]['date']} - ${searchWorkflowExecutionStatData[searchWorkflowExecutionStatData.length - 1]['date']}`}</CardDescription>
        <span className={cn('flex items-end gap-1', count == 0 && '[&>*]:text-opacity-20')}>
          <span className="text-4xl">{Number.isInteger(count) ? count : count.toFixed(2)}</span>
          {chartConfig[Object.keys(chartConfig)[0]]['unit'] && (
            <span>{chartConfig[Object.keys(chartConfig)[0]]['unit']}</span>
          )}
        </span>
      </CardHeader>
      <CardContent>
        <ReactECharts
          option={chartOption}
          style={{ height: '180px', width: '100%' }}
          notMerge={true}
          lazyUpdate={true}
        />
      </CardContent>
    </Card>
  );
};
