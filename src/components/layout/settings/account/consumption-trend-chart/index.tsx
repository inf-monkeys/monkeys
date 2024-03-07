import React from 'react';

import { Card, CardHeader, CardTitle } from '@/components/ui/card.tsx';

interface IConsumptionTrendChartProps extends React.ComponentPropsWithoutRef<'div'> {}

export const ConsumptionTrendChart: React.FC<IConsumptionTrendChartProps> = () => {
  return (
    <Card>
      <CardHeader>
        <CardTitle>消费趋势图</CardTitle>
      </CardHeader>
    </Card>
  );
};
