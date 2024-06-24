import React, { useEffect, useState } from 'react';

import { useClipboard } from '@mantine/hooks';
import { CircularProgress } from '@nextui-org/progress';
import { Command as CommandPrimitive, CommandLoading } from 'cmdk';
import { Copy, MousePointerSquareDashed, Search } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';

import { useSearchWorkflowExecutions } from '@/apis/workflow/execution';
import { getDescOfTriggerType } from '@/apis/workflow/trigger/utils.ts';
import { ExecutionStatusIcon } from '@/components/layout/vines-view/execution/status-icon';
import { Button } from '@/components/ui/button';
import { Card, CardDescription, CardHeader, CardTitle } from '@/components/ui/card.tsx';
import { Command, CommandEmpty, CommandGroup, CommandItem, CommandList } from '@/components/ui/command';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { useVinesFlow } from '@/package/vines-flow';
import { VinesNodeExecutionTask } from '@/package/vines-flow/core/nodes/typings.ts';
import { useCanvasStore } from '@/store/useCanvasStore';
import { useFlowStore } from '@/store/useFlowStore';
import { CanvasStatus } from '@/store/useFlowStore/typings.ts';
import { useViewStore } from '@/store/useViewStore';
import { cn, execCopy } from '@/utils';
import { formatTimeDiffPrevious } from '@/utils/time.ts';

interface IVinesExecutionHistoryProps extends React.ComponentPropsWithoutRef<'div'> {}

// million-ignore
export const VinesExecutionHistory: React.FC<IVinesExecutionHistoryProps> = () => {
  const { visible } = useViewStore();
  const { setCanvasMode } = useCanvasStore();
  const { workflowId } = useFlowStore();

  const { t } = useTranslation();
  const clipboard = useClipboard({ timeout: 500 });

  const { vines } = useVinesFlow();

  const { data, mutate, isLoading } = useSearchWorkflowExecutions(
    workflowId ? { workflowId, pagination: { page: 1, limit: 100 } } : null,
    0,
  );

  const [activeInstanceId, setActiveInstanceId] = useState('_');

  const vinesExecutionStatus = vines.executionStatus;

  useEffect(() => {
    if (!workflowId || !visible || !data) return;
    const executionInstance = data?.data?.find((it) => it.status === 'PAUSED' || it.status === 'RUNNING');
    const instanceId = executionInstance?.workflowId;
    if (instanceId) {
      vines.swapExecutionInstance(executionInstance);
      setActiveInstanceId(instanceId);
      setCanvasMode(CanvasStatus.RUNNING);
    }
  }, [data]);

  useEffect(() => {
    !['SCHEDULED', 'CANCELED'].includes(vinesExecutionStatus) && mutate();
  }, [vinesExecutionStatus]);

  const finalData =
    data?.data?.sort((a) => (a.status === 'PAUSED' || a.status === 'RUNNING' ? -1 : 1)).slice(0, 20) ?? [];

  const workflowStatus = vines.executionStatus;
  const isEmpty = !finalData?.length && !isLoading;

  return (
    <Command className="bg-transparent" value={activeInstanceId}>
      <div className="relative m-4 mt-1 flex items-center rounded-md border border-input px-2 has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-vines-500 has-[:focus-visible]:ring-offset-2 [&>div]:mt-1">
        <Search className="mr-2 h-4 w-4 shrink-0 opacity-50" />
        <CommandPrimitive.Input
          className={cn(
            'flex h-11 w-full rounded-md bg-transparent py-3 text-sm outline-none placeholder:text-muted-foreground disabled:cursor-not-allowed disabled:opacity-50',
            isEmpty && 'pointer-events-none opacity-85',
          )}
          placeholder="搜索运行实例 ID"
        />
      </div>
      {isEmpty && (
        <div className="vines-center size-full flex-1 flex-col">
          <MousePointerSquareDashed size={64} />
          <div className="mt-4 flex flex-col text-center">
            <h2 className="font-bold">暂无运行实例</h2>
          </div>
        </div>
      )}
      <CommandList className={cn('relative h-full max-h-none', isEmpty && 'hidden')}>
        {!data && isLoading ? (
          <CommandLoading className="vines-center absolute z-10 size-full py-6">
            <CircularProgress className="[&_circle:last-child]:stroke-vines-500" size="lg" aria-label="Loading..." />
          </CommandLoading>
        ) : !isEmpty ? (
          <CommandEmpty>找不到此运行实例</CommandEmpty>
        ) : null}

        <CommandGroup>
          {finalData.map((it) => {
            const { workflowId: instanceId, startTime, triggerType, status } = it;
            return (
              <CommandItem
                key={instanceId}
                value={instanceId}
                className="cursor-pointer"
                onSelect={(currentValue) => {
                  if (vines.swapExecutionInstance(it)) {
                    setActiveInstanceId(currentValue);
                  }
                }}
              >
                <Card className="flex w-full cursor-pointer items-center justify-between gap-3 p-6">
                  <CardHeader className="p-0">
                    <CardTitle className="text-xl">{`${formatTimeDiffPrevious(startTime ?? 0)}${getDescOfTriggerType(triggerType ?? '')}`}</CardTitle>
                    <div className="flex items-center gap-2">
                      <CardDescription>实例 ID: {instanceId}</CardDescription>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button
                            className="-m-2 scale-50"
                            icon={<Copy />}
                            onClick={(e) => {
                              e.stopPropagation();
                              if (!instanceId) {
                                toast.error(t('common.toast.loading'));
                                return;
                              }
                              clipboard.copy(instanceId);
                              if (!clipboard.copied && !execCopy(instanceId))
                                toast.error(t('common.toast.copy-failed'));
                              else toast.success(t('common.toast.copy-success'));
                            }}
                          />
                        </TooltipTrigger>
                        <TooltipContent>点击复制</TooltipContent>
                      </Tooltip>
                    </div>
                  </CardHeader>
                  <ExecutionStatusIcon
                    status={status as VinesNodeExecutionTask['status']}
                    workflowStatus={workflowStatus}
                  />
                </Card>
              </CommandItem>
            );
          })}
        </CommandGroup>
      </CommandList>
    </Command>
  );
};
