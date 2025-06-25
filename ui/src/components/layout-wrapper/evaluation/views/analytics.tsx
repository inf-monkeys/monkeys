import React from 'react';

import { BarChart3 } from 'lucide-react';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export const AnalyticsView: React.FC = () => {
  return (
    <div className="h-full overflow-auto p-6">
      <div className="mx-auto max-w-6xl space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="flex items-center gap-2 text-2xl font-bold">
              <BarChart3 className="h-6 w-6" />
              数据分析
            </h1>
            <p className="text-muted-foreground">此功能正在开发中</p>
          </div>
        </div>
        <Card>
          <CardHeader>
            <CardTitle>即将推出</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex h-64 items-center justify-center">
              <p className="text-muted-foreground">数据分析功能即将上线，敬请期待。</p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};
