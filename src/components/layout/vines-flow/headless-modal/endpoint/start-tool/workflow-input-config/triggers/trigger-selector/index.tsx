import React, { useEffect, useState } from 'react';

import { useSWRConfig } from 'swr';

import { toast } from 'sonner';

import { useTriggerCreate, useTriggerTypes } from '@/apis/workflow/trigger';
import { ITriggerType, WorkflowTriggerType } from '@/apis/workflow/trigger/typings.ts';
import { Card } from '@/components/ui/card.tsx';
import { Dialog, DialogContent, DialogDescription, DialogTitle } from '@/components/ui/dialog';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { VinesIcon } from '@/components/ui/vines-icon';
import { useVinesFlow } from '@/package/vines-flow';
import { useFlowStore } from '@/store/useFlowStore';
import VinesEvent from '@/utils/events.ts';

interface ITriggerSelectorProps {}

export const TriggerSelector: React.FC<ITriggerSelectorProps> = () => {
  const { workflowId } = useFlowStore();

  const { mutate } = useSWRConfig();

  const { vines } = useVinesFlow();

  const { data: triggerTypes } = useTriggerTypes();
  const { trigger: createTrigger } = useTriggerCreate(workflowId);

  const [open, setOpen] = useState(false);

  useEffect(() => {
    const handleOpen = (_wid: string) => {
      if (workflowId !== _wid) return;
      setOpen(true);
    };
    VinesEvent.on('flow-trigger-selector', handleOpen);
    return () => {
      VinesEvent.off('flow-trigger-selector', handleOpen);
    };
  }, []);

  const workflowVersion = vines.version;

  const handleCreateTrigger = (triggerType: ITriggerType) => {
    const type = triggerType.type;

    if (type === WorkflowTriggerType.MANUALLY) {
      toast.promise(createTrigger({ triggerType: type, enabled: true, version: workflowVersion }), {
        loading: '正在创建触发器',
        success: () => {
          void mutate(`/api/workflow/${workflowId}/triggers?version=${workflowVersion}`);
          return '触发器创建成功';
        },
        error: '触发器创建失败',
      });
    }

    setOpen(false);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent>
        <DialogTitle>选择触发器</DialogTitle>
        <DialogDescription>选择一个触发器，通过触发事件或定时任务来触发工作流的运行</DialogDescription>
        <div className="grid w-full grid-cols-2 gap-4">
          {triggerTypes?.map((triggerType, i) => {
            const { displayName, description, icon } = triggerType;
            return (
              <Card
                className="flex cursor-pointer items-center gap-4 p-4 hover:bg-gray-2 dark:hover:bg-gray-4"
                onClick={() => handleCreateTrigger(triggerType)}
                key={i}
              >
                <div className="relative flex h-12 w-12 flex-shrink-0 items-end justify-end overflow-clip rounded-lg border-input shadow-md">
                  <div className="absolute">
                    <VinesIcon className="size-full" size="lg" src={icon} />
                  </div>
                </div>
                <div className="leading-5">
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <div className="line-clamp-1 select-none font-bold">{displayName}</div>
                    </TooltipTrigger>
                    <TooltipContent>{displayName}</TooltipContent>
                  </Tooltip>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <div className="mt-1 line-clamp-1 select-none text-xs opacity-50">{description}</div>
                    </TooltipTrigger>
                    <TooltipContent side="bottom" className="max-w-64">
                      {description}
                    </TooltipContent>
                  </Tooltip>
                </div>
              </Card>
            );
          })}
        </div>
      </DialogContent>
    </Dialog>
  );
};
