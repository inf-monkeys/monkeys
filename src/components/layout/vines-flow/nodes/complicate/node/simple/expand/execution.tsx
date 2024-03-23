import React, { useMemo } from 'react';

import moment from 'moment';

import { ExecutionRawDataDisplay } from '@/components/layout/vines-execution/data-display/raw';
import { JSONValue } from '@/components/ui/code-editor';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs.tsx';
import { VinesNodeExecutionTask } from '@/package/vines-flow/core/nodes/typings.ts';

interface IComplicateSimpleNodeExecutionExpandProps {
  executionTask?: VinesNodeExecutionTask;
}

export const ComplicateSimpleNodeExecutionExpand: React.FC<IComplicateSimpleNodeExecutionExpandProps> = ({
  executionTask,
}) => {
  const executionStartTime = executionTask?.startTime ?? 0;
  const executionEndTime = executionTask?.endTime ?? 0;

  const startTime = executionStartTime ? moment(executionStartTime).format('YYYY-MM-DD HH:mm:ss') : '-';
  const endTime = executionEndTime ? moment(executionEndTime).format('YYYY-MM-DD HH:mm:ss') : '-';
  const currentDuration = useMemo(() => {
    const duration = moment.duration(moment(executionEndTime).diff(moment(executionStartTime)));
    const days = duration.days();
    const hours = duration.hours();
    const minutes = duration.minutes();
    const seconds = duration.seconds();
    const milliseconds = duration.milliseconds();
    if (days > 0) return `${days} 天`;
    if (hours > 0) return `${hours} 小时`;
    if (minutes > 0) return `${minutes} 分钟`;
    if (seconds > 0) return `${seconds} 秒`;
    if (milliseconds > 0) return `${milliseconds} 毫秒`;
    return '-';
  }, [executionStartTime, executionEndTime]);

  const externalStorageInputDataUrl = executionTask?.externalOutputPayloadStoragePath;
  const externalStorageOutputDataUrl = executionTask?.externalOutputPayloadStoragePath;

  return (
    <div className="flex flex-col gap-3 p-5">
      <div className="text-text1 flex shrink-0 grow-0 flex-wrap text-xs">
        <p className="mr-4">开始时间：{startTime}</p>
        <p className="mr-4">结束时间：{endTime}</p>
        <p className="mr-4">运行时长：{currentDuration}</p>
      </div>
      <Tabs defaultValue="data">
        <TabsList>
          <TabsTrigger value="data">数据</TabsTrigger>
          <TabsTrigger value="input">输入</TabsTrigger>
          <TabsTrigger value="output">输出</TabsTrigger>
          <TabsTrigger value="raw">原始数据</TabsTrigger>
        </TabsList>
        <TabsContent value="data" className="h-[20.5rem]"></TabsContent>
        <TabsContent value="input" className="h-[20.5rem]">
          <ExecutionRawDataDisplay
            data={executionTask?.inputData ?? {}}
            externalStorageDataUrl={externalStorageInputDataUrl}
          />
        </TabsContent>
        <TabsContent value="output" className="h-[20.5rem]">
          <ExecutionRawDataDisplay
            data={executionTask?.outputData ?? {}}
            externalStorageDataUrl={externalStorageOutputDataUrl}
          />
        </TabsContent>
        <TabsContent value="raw" className="h-[20.5rem]">
          <ExecutionRawDataDisplay data={(executionTask as JSONValue) ?? {}} />
        </TabsContent>
      </Tabs>
    </div>
  );
};
