import React, { memo } from 'react';

import { useClipboard } from '@mantine/hooks';
import { isEmpty } from 'lodash';
import { Copy, Workflow } from 'lucide-react';
import { toast } from 'sonner';

import { IVinesChatListItem } from '@/components/layout/view/vines-chat/list/typings.ts';
import { VinesAbstractDataPreview } from '@/components/layout/vines-execution/data-display/abstract';
import { ExecutionStatusIcon } from '@/components/layout/vines-execution/status-icon';
import { WorkflowInputList } from '@/components/layout/vines-flow/headless-modal/endpoint/start-tool/workflow-input-config/input-config/input-list';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar.tsx';
import { Button } from '@/components/ui/button';
import { Card, CardDescription } from '@/components/ui/card.tsx';
import { JSONValue } from '@/components/ui/code-editor';
import { VinesHighlighter } from '@/components/ui/highlighter';
import { Separator } from '@/components/ui/separator.tsx';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { VinesIcon } from '@/components/ui/vines-icon';
import { VinesNodeExecutionTask } from '@/package/vines-flow/core/nodes/typings.ts';
import { cn } from '@/utils';

const MessageItem = memo<{ data: IVinesChatListItem }>(({ data }) => {
  const clipboard = useClipboard({ timeout: 500 });

  const status = data.status;
  const instanceId = data.instanceId;
  const inputs = data.input;
  const originalInput = data.originalInput;
  const hasInput = inputs.length > 0;
  const hasOriginalInput = !isEmpty(originalInput);

  const botPhoto = data.botPhoto;
  const userPhoto = data.userPhoto;
  const userName = data.userName;

  const startTime = data.startTime;
  const endTime = data.endTime;

  const finalData = data.output as JSONValue;

  return (
    <div className="flex flex-col gap-4 py-4">
      <div className="group flex w-full max-w-full flex-row-reverse gap-4">
        <Avatar className="size-8 cursor-pointer">
          <AvatarImage className="aspect-auto" src={userPhoto} alt={userName} />
          <AvatarFallback className="rounded-none p-2 text-xs">{userName.substring(0, 2)}</AvatarFallback>
        </Avatar>
        <div className="-mt-5 flex flex-col gap-1">
          <span className="text-end text-xs text-gray-400 opacity-0 transition-opacity group-hover:opacity-100">
            {startTime}
          </span>
          <Card className={cn('p-4 text-sm', hasInput && 'min-w-80')}>
            {hasInput ? (
              <WorkflowInputList
                inputs={inputs}
                defaultValueText={''}
                cardClassName="p-0 border-transparent shadow-transparent"
              />
            ) : hasOriginalInput ? (
              <VinesHighlighter language="json">{JSON.stringify(originalInput, null, 2)}</VinesHighlighter>
            ) : (
              '手动或自动执行触发'
            )}
          </Card>
        </div>
      </div>
      <div className="group flex flex-row items-start gap-4">
        <VinesIcon size="sm">{botPhoto}</VinesIcon>

        <div className="-mt-5 flex flex-col gap-1">
          <span className="text-xs text-gray-400 opacity-0 transition-opacity group-hover:opacity-100">{endTime}</span>
          <Card className="p-4">
            <VinesAbstractDataPreview data={finalData} />
            <Separator className="my-4" />
            <div className="group/footer flex items-center justify-between gap-4">
              <Tooltip>
                <TooltipTrigger asChild>
                  <div className="flex items-center gap-2">
                    <CardDescription className="flex gap-1">
                      <Workflow size={12} className="mt-0.5 stroke-muted-foreground" /> {instanceId}
                    </CardDescription>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button
                          className="-m-2 scale-50 opacity-0 group-hover/footer:opacity-100"
                          icon={<Copy />}
                          variant="outline"
                          onClick={(e) => {
                            e.stopPropagation();
                            clipboard.copy(instanceId);
                            toast.success('已复制实例 ID');
                          }}
                        />
                      </TooltipTrigger>
                      <TooltipContent>点击复制</TooltipContent>
                    </Tooltip>
                  </div>
                </TooltipTrigger>
                <TooltipContent>运行实例 ID</TooltipContent>
              </Tooltip>
              <ExecutionStatusIcon
                className="-m-1 scale-80"
                status={status as VinesNodeExecutionTask['status']}
                workflowStatus={status as string}
              />
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
});

MessageItem.displayName = 'VinesMessageItem';

export const VirtualizedItem = (_index: number, data: IVinesChatListItem) => {
  return <MessageItem data={data} />;
};
