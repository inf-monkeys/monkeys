import React from 'react';

import { useTranslation } from 'react-i18next';

import { InputConfig } from '@/components/layout/workspace/vines-view/flow/headless-modal/endpoint/start-tool/workflow-input-config/input-config';
import { WorkflowTrigger } from '@/components/layout/workspace/vines-view/flow/headless-modal/endpoint/start-tool/workflow-input-config/triggers';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs.tsx';

import { WorkflowApiConfig } from './api-config';

interface IWorkflowInputConfigProps {}

export const WorkflowInputConfig: React.FC<IWorkflowInputConfigProps> = () => {
  const { t } = useTranslation();

  return (
    <Tabs defaultValue="input">
      <TabsList>
        <TabsTrigger value="input">{t('workspace.flow-view.endpoint.start-tool.tabs.input')}</TabsTrigger>
        <TabsTrigger value="trigger">{t('workspace.flow-view.endpoint.start-tool.tabs.trigger')}</TabsTrigger>
        <TabsTrigger value="api-config">{t('workspace.flow-view.endpoint.start-tool.tabs.api-config')}</TabsTrigger>
      </TabsList>
      <TabsContent value="input">
        <InputConfig contentWidth={412} />
      </TabsContent>
      <TabsContent value="trigger">
        <WorkflowTrigger />
      </TabsContent>
      <TabsContent value="api-config">
        <WorkflowApiConfig />
      </TabsContent>
    </Tabs>
  );
};
