import React from 'react';

import { InputConfig } from '@/components/layout/vines-flow/headless-modal/endpoint/start-tool/workflow-input-config/input-config';
import { WorkflowTrigger } from '@/components/layout/vines-flow/headless-modal/endpoint/start-tool/workflow-input-config/triggers';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs.tsx';

interface IWorkflowInputConfigProps {}

export const WorkflowInputConfig: React.FC<IWorkflowInputConfigProps> = () => {
  return (
    <Tabs defaultValue="input">
      <TabsList>
        <TabsTrigger value="input">工作流输入</TabsTrigger>
        <TabsTrigger value="trigger">触发器</TabsTrigger>
      </TabsList>
      <TabsContent value="input">
        <InputConfig contentWidth={412} />
      </TabsContent>
      <TabsContent value="trigger">
        <WorkflowTrigger />
      </TabsContent>
    </Tabs>
  );
};
