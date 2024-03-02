import React from 'react';

import { Download } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Card, CardDescription, CardHeader, CardTitle } from '@/components/ui/card.tsx';

interface IRechargeDetailsProps extends React.ComponentPropsWithoutRef<'div'> {}

export const RechargeDetails: React.FC<IRechargeDetailsProps> = () => {
  return (
    <Card>
      <CardHeader className="relative">
        <CardTitle>充值明细</CardTitle>
        <CardDescription>累计充值 ￥0.00</CardDescription>
        <div className="absolute left-0 top-0 !mt-0 flex size-full items-center justify-end p-6">
          <Button icon={<Download />} size="small">
            下载明细
          </Button>
        </div>
      </CardHeader>
    </Card>
  );
};
