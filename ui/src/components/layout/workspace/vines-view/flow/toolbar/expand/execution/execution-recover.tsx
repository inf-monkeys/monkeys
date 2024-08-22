import React, { useEffect, useState } from 'react';

import { Check, ChevronsUpDown } from 'lucide-react';
import { useTranslation } from 'react-i18next';

import { useSearchWorkflowExecutions } from '@/apis/workflow/execution';
import { WorkflowTriggerType } from '@/apis/workflow/trigger/typings.ts';
import { getDescOfTriggerType } from '@/apis/workflow/trigger/utils.ts';
import { Button } from '@/components/ui/button';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem } from '@/components/ui/command';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { useVinesFlow } from '@/package/vines-flow';
import { useCanvasStore } from '@/store/useCanvasStore';
import { useFlowStore } from '@/store/useFlowStore';
import { CanvasStatus } from '@/store/useFlowStore/typings.ts';
import { cn } from '@/utils';
import { formatTimeDiffPrevious } from '@/utils/time.ts';

interface IExecutionRecoverProps {
  className?: string;
}

export const ExecutionRecover: React.FC<IExecutionRecoverProps> = ({ className }) => {
  const { t } = useTranslation();

  const setCanvasMode = useCanvasStore((s) => s.setCanvasMode);
  const workflowId = useFlowStore((s) => s.workflowId);

  const { data } = useSearchWorkflowExecutions(
    workflowId
      ? {
          workflowId,
          status: ['PAUSED', 'RUNNING'],
          pagination: { page: 1, limit: 100 },
        }
      : null,
    0,
  );

  const { vines } = useVinesFlow();

  const [open, setOpen] = useState(false);
  const [activeInstanceId, setActiveInstanceId] = useState('');

  useEffect(() => {
    if (!workflowId || !data) return;
    const executionInstance = data?.data?.at(0);
    const instanceId = executionInstance?.workflowId;
    if (instanceId) {
      vines.swapExecutionInstance(executionInstance);
      setActiveInstanceId(instanceId);
      setCanvasMode(CanvasStatus.RUNNING);
    }
  }, [workflowId, data]);

  const executions = data?.data ?? [];
  const hasData = (executions.length ?? 0) > 1;

  const currentActiveExecution = executions.find((it) => it.workflowId === activeInstanceId);
  const activeExecutionName = currentActiveExecution
    ? `${formatTimeDiffPrevious(currentActiveExecution?.startTime ?? 0)}${getDescOfTriggerType(currentActiveExecution?.triggerType ?? WorkflowTriggerType.MANUAL)} ${currentActiveExecution?.workflowId}`
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
                disabled={vines.executionStatus() === 'RUNNING'}
                className={cn('w-60 justify-between', className)}
              >
                <span className="line-clamp-1">
                  {currentActiveExecution
                    ? activeExecutionName
                    : t('workspace.flow-view.execution.run-history.select-placeholder')}
                </span>
                <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
              </Button>
            </PopoverTrigger>
          </TooltipTrigger>
          <PopoverContent className="w-60 p-0">
            <Command>
              <CommandInput placeholder={t('workspace.flow-view.execution.run-history.search')} />
              <CommandEmpty>{t('workspace.flow-view.execution.run-history.search-empty')}</CommandEmpty>
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
                        {`${formatTimeDiffPrevious(startTime ?? 0)}${getDescOfTriggerType(triggerType ?? WorkflowTriggerType.MANUAL)} ${instanceId}`}
                      </span>
                    </CommandItem>
                  );
                })}
              </CommandGroup>
            </Command>
          </PopoverContent>
        </Popover>
        <TooltipContent>{t('workspace.flow-view.execution.run-history.tips')}</TooltipContent>
      </Tooltip>
    )
  );
};
