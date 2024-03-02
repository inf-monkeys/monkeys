import React from 'react';

import { Download } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Card, CardDescription, CardHeader, CardTitle } from '@/components/ui/card.tsx';

interface IConsumerDetailsProps extends React.ComponentPropsWithoutRef<'div'> {}

export const ConsumerDetails: React.FC<IConsumerDetailsProps> = () => {
  return (
    <Card>
      <CardHeader className="relative">
        <CardTitle>消费明细</CardTitle>
        <CardDescription>累计消费 ￥0.00</CardDescription>
        <div className="absolute left-0 top-0 !mt-0 flex size-full items-center justify-end p-6">
          <Button icon={<Download />} size="small">
            下载明细
          </Button>
        </div>
      </CardHeader>
    </Card>
  );
};
