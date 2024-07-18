import React from 'react';

import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip as RechartsTooltip,
  XAxis,
  YAxis,
} from 'recharts';

import { VinesWorkflowExecutionStatData } from '@/apis/workflow/execution/typings.ts';
import { CHART_INFO } from '@/components/layout/vines-view/execution-log/stat/chart/consts.ts';
import { getI18nContent } from '@/utils';

interface IVinesLogViewStatChartProps {
  searchWorkflowExecutionStatData?: VinesWorkflowExecutionStatData[];
  handleSubmit: () => void;
}

export const VinesLogViewStatChart: React.FC<IVinesLogViewStatChartProps> = ({ searchWorkflowExecutionStatData }) => {
  const CHART_LABEL_MAPPER = CHART_INFO.reduce((acc, item) => {
    acc[item.id] = getI18nContent(item.displayName);
    return acc;
  }, {});
  return (
    <>
      {searchWorkflowExecutionStatData && (
        <ResponsiveContainer height={250}>
          <AreaChart
            data={searchWorkflowExecutionStatData.map((data) => {
              data.averageTime = parseFloat((data.averageTime / 1000).toFixed(2));
              return data;
            })}
            margin={{ top: 5, right: 20, bottom: 5, left: 0 }}
          >
            <defs>
              {CHART_INFO.map(({ id, color }) => (
                <linearGradient id={id} x1="0" y1="0" x2="0" y2="1" key={id}>
                  <stop offset="5%" stopColor={color} stopOpacity={0.8} />
                  <stop offset="95%" stopColor={color} stopOpacity={0} />
                </linearGradient>
              ))}
            </defs>
            {CHART_INFO.map(({ id, color }) => (
              <Area type="monotone" dataKey={id} stroke={color} fillOpacity={1} fill={`url(#${id})`} key={id} />
            ))}
            <CartesianGrid stroke="#ccc" strokeDasharray="5 5" />
            <XAxis dataKey="date" />
            <YAxis />
            <RechartsTooltip
              content={({ payload, label, active }) => {
                return (
                  <div className="flex flex-col gap-3 rounded-lg bg-slate-1 bg-opacity-30 p-3 shadow-md backdrop-blur">
                    <span>{label}</span>
                    {payload?.map((p, index) => {
                      return (
                        <div className="grid grid-cols-5 text-sm" key={index}>
                          <span className="col-span-2 flex justify-start font-bold">
                            {CHART_LABEL_MAPPER[p.dataKey!]}
                          </span>
                          <span className="col-span-3 flex flex-wrap justify-end">{p.value}</span>
                        </div>
                      );
                    })}
                  </div>
                );
              }}
            />
          </AreaChart>
        </ResponsiveContainer>
      )}
    </>
  );
};
