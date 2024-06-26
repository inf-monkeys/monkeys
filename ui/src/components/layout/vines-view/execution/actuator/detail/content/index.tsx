import React, { memo, useEffect, useState } from 'react';

import { useElementSize } from '@mantine/hooks';
import { useTranslation } from 'react-i18next';

import { VinesActuatorDetailData } from '@/components/layout/vines-view/execution/actuator/detail/content/data.tsx';
import { ExecutionRawDataDisplay } from '@/components/layout/vines-view/execution/data-display/raw';
import { JSONValue } from '@/components/ui/code-editor';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs.tsx';
import { VinesNodeExecutionTask } from '@/package/vines-flow/core/nodes/typings.ts';
import { useViewStore } from '@/store/useViewStore';
import { cn } from '@/utils';

interface IVinesActuatorDetailContentProps {
  executionTask?: VinesNodeExecutionTask;
  className?: string;
  height?: number;
}

export const VinesActuatorDetailContent: React.FC<IVinesActuatorDetailContentProps> = memo(
  ({ executionTask, className, height }) => {
    const { t } = useTranslation();

    const { ref, height: headerHeight } = useElementSize();

    const executionOutputData = executionTask?.outputData ?? {};
    const executionInputData = executionTask?.inputData ?? {};
    const externalStorageInputDataUrl = executionTask?.externalOutputPayloadStoragePath;
    const externalStorageOutputDataUrl = executionTask?.externalOutputPayloadStoragePath;

    const finalHeight = height ? height - 14 - headerHeight : 320;

    const { fullscreen } = useViewStore();

    const [activeTab, setActiveTab] = useState('data');

    useEffect(() => {
      const prevActiveTab = activeTab;
      setActiveTab('input');
      setTimeout(() => setActiveTab(prevActiveTab));
    }, [fullscreen]);

    return (
      <div className={cn('flex flex-col gap-3', className)}>
        <Tabs defaultValue="data" value={activeTab} onValueChange={setActiveTab}>
          <TabsList ref={ref}>
            <TabsTrigger value="data">{t('workspace.pre-view.actuator.detail.tabs.data')}</TabsTrigger>
            <TabsTrigger value="input">{t('workspace.pre-view.actuator.detail.tabs.input')}</TabsTrigger>
            <TabsTrigger value="output">{t('workspace.pre-view.actuator.detail.tabs.output')}</TabsTrigger>
            <TabsTrigger value="raw">{t('workspace.pre-view.actuator.detail.tabs.raw')}</TabsTrigger>
          </TabsList>
          <TabsContent value="data">
            <VinesActuatorDetailData height={finalHeight} executionTask={executionTask} />
          </TabsContent>
          <TabsContent value="input" style={{ height: finalHeight }}>
            <ExecutionRawDataDisplay data={executionInputData} externalStorageDataUrl={externalStorageInputDataUrl} />
          </TabsContent>
          <TabsContent value="output" style={{ height: finalHeight }}>
            <ExecutionRawDataDisplay data={executionOutputData} externalStorageDataUrl={externalStorageOutputDataUrl} />
          </TabsContent>
          <TabsContent value="raw" style={{ height: finalHeight }}>
            <ExecutionRawDataDisplay data={(executionTask as JSONValue) ?? {}} />
          </TabsContent>
        </Tabs>
      </div>
    );
  },
);

VinesActuatorDetailContent.displayName = 'VinesActuatorDetailContent';
