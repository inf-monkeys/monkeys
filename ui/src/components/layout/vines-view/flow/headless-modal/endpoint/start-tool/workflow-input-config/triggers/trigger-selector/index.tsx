import React, { useEffect, useState } from 'react';

import { useSWRConfig } from 'swr';

import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';

import { useTriggerCreate, useTriggerTypes } from '@/apis/workflow/trigger';
import { ITriggerType, WorkflowTriggerType } from '@/apis/workflow/trigger/typings.ts';
import { ScheduleTrigger } from '@/components/layout/vines-view/flow/headless-modal/endpoint/start-tool/workflow-input-config/triggers/trigger-selector/schedule-trigger';
import { WebhookTrigger } from '@/components/layout/vines-view/flow/headless-modal/endpoint/start-tool/workflow-input-config/triggers/trigger-selector/webhook-trigger';
import { Card } from '@/components/ui/card.tsx';
import { Dialog, DialogContent, DialogDescription, DialogTitle } from '@/components/ui/dialog';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { VinesIcon } from '@/components/ui/vines-icon';
import { useVinesFlow } from '@/package/vines-flow';
import { useFlowStore } from '@/store/useFlowStore';
import VinesEvent from '@/utils/events.ts';

import { CustomTrigger } from './custom-trigger';

interface ITriggerSelectorProps {}

export const TriggerSelector: React.FC<ITriggerSelectorProps> = () => {
  const { t } = useTranslation();

  const workflowId = useFlowStore((s) => s.workflowId);

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

    if (type === WorkflowTriggerType.MANUAL) {
      toast.promise(createTrigger({ triggerType: type, enabled: true, version: workflowVersion }), {
        loading: t('workspace.flow-view.endpoint.start-tool.trigger.create.loading'),
        success: () => {
          void mutate(`/api/workflow/${workflowId}/triggers?version=${workflowVersion}`);
          return t('workspace.flow-view.endpoint.start-tool.trigger.create.success');
        },
        error: t('workspace.flow-view.endpoint.start-tool.trigger.create.error'),
      });
    } else if (type === WorkflowTriggerType.SCHEDULER) {
      VinesEvent.emit('flow-trigger-schedule', workflowId);
    } else if (type === WorkflowTriggerType.WEBHOOK) {
      VinesEvent.emit('flow-trigger-webhook', workflowId);
    } else {
      VinesEvent.emit('flow-trigger-custom', workflowId, triggerType);
    }

    setOpen(false);
  };

  return (
    <>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogTitle>{t('workspace.flow-view.endpoint.start-tool.trigger.create.title')}</DialogTitle>
          <DialogDescription>{t('workspace.flow-view.endpoint.start-tool.trigger.create.desc')}</DialogDescription>
          <div className="grid w-full grid-cols-2 gap-4">
            {triggerTypes?.map((triggerType, i) => {
              const { displayName, description, icon } = triggerType;
              return (
                <Card
                  className="flex cursor-pointer items-center gap-4 p-4 hover:bg-gray-2 dark:hover:bg-gray-4"
                  onClick={() => handleCreateTrigger(triggerType)}
                  key={i}
                >
                  <div className="relative flex h-12 w-12 flex-shrink-0 items-end justify-end overflow-hidden rounded-lg border-input shadow-md">
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
      <ScheduleTrigger />
      <WebhookTrigger />
      <CustomTrigger />
    </>
  );
};
