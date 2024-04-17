import React from 'react';

import { Card, CardHeader, CardTitle } from '@/components/ui/card.tsx';

interface IWorkflowComponentUsageProps extends React.ComponentPropsWithoutRef<'div'> {}

export const WorkflowComponentUsage: React.FC<IWorkflowComponentUsageProps> = () => {
  return (
    <Card>
      <CardHeader>
        <CardTitle>工作流组件使用情况</CardTitle>
      </CardHeader>
    </Card>
  );
};
