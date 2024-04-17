import React, { memo } from 'react';

import { useElementSize } from '@mantine/hooks';

import { VinesActuatorDetailData } from '@/components/layout/vines-view/execution/actuator/detail/content/data.tsx';
import { ExecutionRawDataDisplay } from '@/components/layout/vines-view/execution/data-display/raw';
import { JSONValue } from '@/components/ui/code-editor';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs.tsx';
import { VinesNodeExecutionTask } from '@/package/vines-flow/core/nodes/typings.ts';
import { cn } from '@/utils';

interface IVinesActuatorDetailContentProps {
  executionTask?: VinesNodeExecutionTask;
  className?: string;
  height?: number;
}

export const VinesActuatorDetailContent: React.FC<IVinesActuatorDetailContentProps> = memo(
  ({ executionTask, className, height }) => {
    const { ref, height: headerHeight } = useElementSize();

    const executionOutputData = executionTask?.outputData ?? {};
    const executionInputData = executionTask?.inputData ?? {};
    const externalStorageInputDataUrl = executionTask?.externalOutputPayloadStoragePath;
    const externalStorageOutputDataUrl = executionTask?.externalOutputPayloadStoragePath;

    const finalHeight = height ? height - 14 - headerHeight : 320;

    return (
      <div className={cn('flex flex-col gap-3', className)}>
        <Tabs defaultValue="data">
          <TabsList ref={ref}>
            <TabsTrigger value="data">数据</TabsTrigger>
            <TabsTrigger value="input">输入</TabsTrigger>
            <TabsTrigger value="output">输出</TabsTrigger>
            <TabsTrigger value="raw">原始数据</TabsTrigger>
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
