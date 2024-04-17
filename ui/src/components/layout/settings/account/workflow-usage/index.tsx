import React from 'react';

import { Card, CardHeader, CardTitle } from '@/components/ui/card.tsx';

interface IWorkflowUsageProps extends React.ComponentPropsWithoutRef<'div'> {}

export const WorkflowUsage: React.FC<IWorkflowUsageProps> = () => {
  return (
    <Card>
      <CardHeader>
        <CardTitle>工作流使用情况</CardTitle>
      </CardHeader>
    </Card>
  );
};
