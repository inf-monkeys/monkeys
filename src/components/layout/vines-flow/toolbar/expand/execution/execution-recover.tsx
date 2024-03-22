import React, { useEffect, useState } from 'react';

import { Check, ChevronsUpDown } from 'lucide-react';

import { useSearchWorkflowExecutions } from '@/apis/workflow/execution';
import { getDescOfTriggerType } from '@/apis/workflow/trigger/utils.ts';
import { Button } from '@/components/ui/button';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem } from '@/components/ui/command';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { useVinesFlow } from '@/package/vines-flow';
import { useFlowStore } from '@/store/useFlowStore';
import { CanvasStatus } from '@/store/useFlowStore/typings.ts';
import { cn } from '@/utils';
import { formatTimeDiffPrevious } from '@/utils/time.ts';

interface IExecutionRecoverProps {
  className?: string;
}

export const ExecutionRecover: React.FC<IExecutionRecoverProps> = ({ className }) => {
  const { workflowId, setCanvasMode } = useFlowStore();
  const { trigger, data } = useSearchWorkflowExecutions();

  const { vines } = useVinesFlow();

  const [open, setOpen] = useState(false);
  const [activeInstanceId, setActiveInstanceId] = useState('');

  useEffect(() => {
    if (!workflowId) return;
    trigger({ workflowId, status: ['PAUSED', 'RUNNING'], pagination: { page: 1, limit: 100 } }).then((it) => {
      const executionInstance = it?.data?.at(0);
      const instanceId = executionInstance?.workflowId;
      if (instanceId) {
        vines.swapExecutionInstance(executionInstance);
        setActiveInstanceId(instanceId);
        setCanvasMode(CanvasStatus.RUNNING);
      }
    });
  }, [workflowId]);

  const executions = data?.data ?? [];
  const hasData = (executions.length ?? 0) > 1;

  const currentActiveExecution = executions.find((it) => it.workflowId === activeInstanceId);
  const activeExecutionName = currentActiveExecution
    ? `${formatTimeDiffPrevious(currentActiveExecution?.startTime ?? 0)}${getDescOfTriggerType(currentActiveExecution?.triggerType ?? '')} ${currentActiveExecution?.workflowId}`
    : '';

  return (
    hasData && (
      <Tooltip>
        <Popover open={open} onOpenChange={setOpen}>
          <TooltipTrigger asChild>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                role="combobox"
                aria-expanded={open}
                disabled={vines.executionStatus === 'RUNNING'}
                className={cn('w-60 justify-between', className)}
              >
                <span className="line-clamp-1">
                  {currentActiveExecution ? activeExecutionName : '选择一个运行记录'}
                </span>
                <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
              </Button>
            </PopoverTrigger>
          </TooltipTrigger>
          <PopoverContent className="w-60 p-0">
            <Command>
              <CommandInput placeholder="搜索运行实例 ID..." />
              <CommandEmpty>找不到此运行实例</CommandEmpty>
              <CommandGroup>
                {executions.map((it) => {
                  const { workflowId: instanceId, startTime, triggerType } = it;
                  return (
                    <CommandItem
                      key={instanceId}
                      value={instanceId}
                      className="cursor-pointer"
                      onSelect={(currentValue) => {
                        vines.swapExecutionInstance(it);
                        setActiveInstanceId(currentValue);
                        setOpen(false);
                      }}
                    >
                      <Check
                        className={cn('mr-2 h-4 w-4', activeInstanceId === instanceId ? 'opacity-100' : 'opacity-0')}
                      />
                      <span className="line-clamp-1">
                        {`${formatTimeDiffPrevious(startTime ?? 0)}${getDescOfTriggerType(triggerType ?? '')} ${instanceId}`}
                      </span>
                    </CommandItem>
                  );
                })}
              </CommandGroup>
            </Command>
          </PopoverContent>
        </Popover>
        <TooltipContent>选择一个运行记录，恢复运行</TooltipContent>
      </Tooltip>
    )
  );
};
