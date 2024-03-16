import React from 'react';

import { Plus, Trash2 } from 'lucide-react';

import { useTriggers, useTriggerTypes } from '@/apis/workflow/trigger';
import { ITriggerType } from '@/apis/workflow/trigger/typings.ts';
import { TriggerSelector } from '@/components/layout/vines-flow/headless-modal/endpoint/start-tool/workflow-input-config/trigger-selector';
import { Button } from '@/components/ui/button';
import { Card, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card.tsx';
import { ScrollArea } from '@/components/ui/scroll-area.tsx';
import { Switch } from '@/components/ui/switch';
import { VinesIcon } from '@/components/ui/vines-icon';
import { useVinesFlow } from '@/package/vines-flow';
import { useFlowStore } from '@/store/useFlowStore';
import VinesEvent from '@/utils/events.ts';

interface IWorkflowTriggerProps extends React.ComponentPropsWithoutRef<'div'> {}

export const WorkflowTrigger: React.FC<IWorkflowTriggerProps> = () => {
  const { workflowId } = useFlowStore();
  const { vines } = useVinesFlow();
  const { data: triggers } = useTriggers(workflowId, vines.version);
  const { data: triggerTypes } = useTriggerTypes();

  return (
    <div className="relative flex h-80 w-full flex-col gap-4 py-2">
      <ScrollArea className="px-2">
        {triggers?.map(({ type, enabled }, i) => {
          const { icon, displayName, description } = (triggerTypes?.find((it) => it.type === type) ||
            {}) as ITriggerType;
          return (
            <Card key={i} className="relative">
              <CardHeader className="relative pl-20">
                <div className="absolute left-0 top-0 flex size-full items-center justify-between px-6">
                  <VinesIcon src={icon} size="md" />
                  <Switch checked={enabled} />
                </div>
                <CardTitle>{displayName}</CardTitle>
                <CardDescription>{description}</CardDescription>
              </CardHeader>
              <CardFooter className="flex items-center justify-end">
                <Button className="text-red-10 [&_svg]:stroke-red-10" variant="outline" icon={<Trash2 />} size="small">
                  删除触发器
                </Button>
              </CardFooter>
            </Card>
          );
        })}
      </ScrollArea>
      <Button variant="outline" icon={<Plus />} onClick={() => VinesEvent.emit('flow-trigger-selector', workflowId)}>
        添加触发器
      </Button>
      <TriggerSelector />
    </div>
  );
};
