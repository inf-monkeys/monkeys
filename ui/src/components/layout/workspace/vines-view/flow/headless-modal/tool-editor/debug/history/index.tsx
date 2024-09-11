import React, { cloneElement, forwardRef, ReactElement, useEffect, useRef } from 'react';

import { useCreation, useDebounceEffect } from 'ahooks';
import { Command as CommandPrimitive, CommandLoading } from 'cmdk';
import { Copy, MousePointerSquareDashed, Search } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';
import { CustomItemComponentProps, Virtualizer } from 'virtua';

import { useSearchWorkflowExecutions } from '@/apis/workflow/execution';
import { ExecutionStatusIcon } from '@/components/layout/workspace/vines-view/_common/status-icon';
import { Button } from '@/components/ui/button';
import { Card, CardDescription, CardHeader, CardTitle } from '@/components/ui/card.tsx';
import { Command, CommandEmpty, CommandGroup, CommandItem, CommandList } from '@/components/ui/command';
import { VinesLoading } from '@/components/ui/loading';
import { ScrollArea } from '@/components/ui/scroll-area.tsx';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { useCopy } from '@/hooks/use-copy.ts';
import { useVinesFlow } from '@/package/vines-flow';
import { VinesNodeExecutionTask } from '@/package/vines-flow/core/nodes/typings.ts';
import { VinesWorkflowExecutionType } from '@/package/vines-flow/core/typings.ts';
import { cn } from '@/utils';
import { formatTimeDiffPrevious } from '@/utils/time.ts';

const Item = forwardRef<HTMLDivElement, CustomItemComponentProps>(({ children, style, ...props }, ref) => {
  children = children as ReactElement;

  return cloneElement(children, {
    ref,
    style: { ...children.props.style, ...style },
    ...props,
  });
});
Item.displayName = 'Item';

interface IToolDebugHistoryProps {
  height: number;
  workflowId?: string;
  activeExecutionId: string;
  setActiveExecutionId: React.Dispatch<React.SetStateAction<string>>;
}

export const ToolDebugHistory: React.FC<IToolDebugHistoryProps> = ({
  height,
  workflowId,
  activeExecutionId,
  setActiveExecutionId,
}) => {
  const { t } = useTranslation();

  const { vines, VINES_REFRESHER } = useVinesFlow();

  const { copy } = useCopy({ timeout: 500 });

  const { data, mutate, isLoading } = useSearchWorkflowExecutions(
    workflowId ? { workflowId, pagination: { page: 1, limit: 100 }, versions: [-1] } : null,
    0,
  );

  useDebounceEffect(
    () => {
      if (!workflowId) return;
      void mutate();
    },
    [workflowId, VINES_REFRESHER],
    { wait: 1000 },
  );

  useEffect(() => {
    if (!workflowId || !data) return;
    const executionInstance = data?.data?.find((it) => it.status === 'PAUSED' || it.status === 'RUNNING');
    const instanceId = executionInstance?.workflowId;
    if (instanceId) {
      vines.swapExecutionInstance(executionInstance);
      setActiveExecutionId(instanceId);
    }
  }, [data]);

  const finalData = useCreation(() => {
    return data?.data?.sort((a) => (a.status === 'PAUSED' || a.status === 'RUNNING' ? -1 : 1)).slice(0, 20) ?? [];
  }, [data?.data]);

  const isEmpty = !finalData?.length && !isLoading;

  const scrollRef = useRef<HTMLDivElement>(null);

  return (
    <Command className="bg-transparent" value={activeExecutionId}>
      {isEmpty ? (
        <div className="vines-center size-full flex-1 flex-col">
          <MousePointerSquareDashed size={64} />
          <div className="mt-4 flex flex-col text-center">
            <h2 className="text-sm font-bold">{t('workspace.pre-view.history.search.empty')}</h2>
          </div>
        </div>
      ) : (
        <div className="relative mx-1 mt-1 flex items-center rounded-md border border-input px-2 has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-vines-500 has-[:focus-visible]:ring-offset-2 [&>div]:mt-1">
          <Search className="mr-2 h-4 w-4 shrink-0 opacity-50" />
          <CommandPrimitive.Input
            className={cn(
              'flex h-11 w-full rounded-md bg-transparent py-3 text-sm outline-none placeholder:text-muted-foreground disabled:cursor-not-allowed disabled:opacity-50',
              isEmpty && 'pointer-events-none opacity-85',
            )}
            placeholder={t('workspace.pre-view.history.search.placeholder')}
          />
        </div>
      )}
      <CommandList className={cn('relative h-full max-h-none', isEmpty && 'hidden')}>
        {!data && isLoading ? (
          <CommandLoading className="vines-center absolute z-10 size-full py-6">
            <VinesLoading />
          </CommandLoading>
        ) : !isEmpty ? (
          <CommandEmpty>{t('workspace.pre-view.history.search.search-empty')}</CommandEmpty>
        ) : null}

        <ScrollArea ref={scrollRef} style={{ height: height - 62 }} className="mt-2" disabledOverflowMask>
          <CommandGroup>
            <Virtualizer scrollRef={scrollRef} item={Item}>
              {finalData.map((it) => {
                const { workflowId: instanceId, startTime, status } = it;
                return (
                  <CommandItem
                    key={instanceId}
                    value={instanceId}
                    className="-mx-2 cursor-pointer !bg-transparent"
                    onSelect={(currentValue) => {
                      if (vines.swapExecutionInstance(it)) {
                        setActiveExecutionId(currentValue);
                      }
                    }}
                  >
                    <Card
                      className={cn(
                        'mb-2 flex w-full cursor-pointer items-center justify-between gap-2 p-4',
                        instanceId === activeExecutionId && 'bg-muted',
                      )}
                    >
                      <CardHeader className="p-0">
                        <CardTitle className="text-sm">{formatTimeDiffPrevious(startTime ?? 0)}</CardTitle>
                        <div className="!mt-0 flex items-center gap-1">
                          <CardDescription className="line-clamp-1 text-xs">
                            {t('workspace.pre-view.history.item.desc', { instanceId })}
                          </CardDescription>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Button
                                className="-m-2 scale-50"
                                icon={<Copy />}
                                variant="outline"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  if (!instanceId) {
                                    toast.error(t('common.toast.loading'));
                                    return;
                                  }
                                  copy(instanceId);
                                }}
                              />
                            </TooltipTrigger>
                            <TooltipContent>{t('common.utils.click-to-copy')}</TooltipContent>
                          </Tooltip>
                        </div>
                      </CardHeader>
                      <ExecutionStatusIcon
                        status={status as VinesNodeExecutionTask['status']}
                        workflowStatus={status as VinesWorkflowExecutionType}
                      />
                    </Card>
                  </CommandItem>
                );
              })}
            </Virtualizer>
          </CommandGroup>
        </ScrollArea>
      </CommandList>
    </Command>
  );
};
