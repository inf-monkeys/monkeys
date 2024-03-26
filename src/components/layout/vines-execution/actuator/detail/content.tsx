import React, { memo } from 'react';

import { useElementSize } from '@mantine/hooks';
import { CircularProgress } from '@nextui-org/progress';

import { VinesAbstractDataPreview } from '@/components/layout/vines-execution/data-display/abstract';
import { ExecutionRawDataDisplay } from '@/components/layout/vines-execution/data-display/raw';
import { VinesExecutionHumanInteraction } from '@/components/layout/vines-execution/human-interaction';
import { JSONValue } from '@/components/ui/code-editor';
import { ScrollArea } from '@/components/ui/scroll-area.tsx';
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

    const isCompleted =
      Object.keys(executionOutputData).length > 0 ||
      !['IN_PROGRESS', 'SCHEDULED'].includes(executionTask?.originStatus ?? '');
    const isHUMANInteraction = executionTask?.taskType === 'HUMAN';

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
            <ScrollArea className="[&>div>div]:h-full" style={{ height: finalHeight }}>
              {isCompleted ? (
                <VinesAbstractDataPreview className="px-2" style={{ height: finalHeight }} data={executionOutputData} />
              ) : isHUMANInteraction ? (
                <VinesExecutionHumanInteraction
                  height={finalHeight}
                  instanceId={executionTask?.workflowInstanceId ?? ''}
                  taskId={executionTask?.taskId ?? ''}
                  inputData={executionInputData}
                  taskDefName={executionTask?.taskDefName ?? ''}
                  isCompleted={isCompleted}
                />
              ) : (
                <div className="vines-center size-full">
                  <CircularProgress
                    className="[&_circle:last-child]:stroke-vines-500"
                    size="lg"
                    aria-label="Loading..."
                  />
                </div>
              )}
            </ScrollArea>
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
