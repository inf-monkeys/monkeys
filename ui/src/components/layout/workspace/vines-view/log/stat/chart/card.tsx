import React from 'react';

import { Area, AreaChart, CartesianGrid, XAxis } from 'recharts';

import { VinesWorkflowExecutionStatData } from '@/apis/workflow/execution/typings.ts';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card.tsx';
import { ChartConfig, ChartContainer, ChartTooltip, ChartTooltipContent } from '@/components/ui/chart.tsx';
import { cn } from '@/utils';

export type IVinesLogViewStatChartConfig = ChartConfig & {
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
        <ChartContainer config={chartConfig} className="h-[180px] w-full">
          <AreaChart accessibilityLayer data={searchWorkflowExecutionStatData}>
            <CartesianGrid vertical={false} />
            <defs>
              {Object.keys(chartConfig).map((key) => {
                const { color } = chartConfig[key];
                return (
                  <linearGradient id={key} x1="0" y1="0" x2="0" y2="1" key={key}>
                    <stop offset="5%" stopColor={color} stopOpacity={0.8} />
                    <stop offset="95%" stopColor={color} stopOpacity={0} />
                  </linearGradient>
                );
              })}
            </defs>
            {Object.keys(chartConfig).map((key) => (
              <Area
                type="monotone"
                dataKey={key}
                stroke={chartConfig[key].color}
                fillOpacity={1}
                fill={`url(#${key})`}
                key={key}
              />
            ))}
            <CartesianGrid stroke="#ccc" strokeDasharray="5 5" />
            <XAxis dataKey="date" />
            <ChartTooltip content={<ChartTooltipContent />} />
          </AreaChart>
        </ChartContainer>
      </CardContent>
    </Card>
  );
};
