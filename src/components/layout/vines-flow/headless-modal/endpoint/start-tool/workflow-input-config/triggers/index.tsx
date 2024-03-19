import React from 'react';

import { Plus } from 'lucide-react';
import { TriggerSelector } from 'src/components/layout/vines-flow/headless-modal/endpoint/start-tool/workflow-input-config/triggers/trigger-selector';

import { useTriggers } from '@/apis/workflow/trigger';
import { Trigger } from '@/components/layout/vines-flow/headless-modal/endpoint/start-tool/workflow-input-config/triggers/trigger.tsx';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area.tsx';
import { useVinesFlow } from '@/package/vines-flow';
import { useFlowStore } from '@/store/useFlowStore';
import { cn } from '@/utils';
import VinesEvent from '@/utils/events.ts';

interface IWorkflowTriggerProps extends React.ComponentPropsWithoutRef<'div'> {}

export const WorkflowTrigger: React.FC<IWorkflowTriggerProps> = ({ className }) => {
  const { workflowId, isLatestWorkflowVersion } = useFlowStore();
  const { vines } = useVinesFlow();

  const workflowVersion = vines.version;
  const { data: triggers } = useTriggers(workflowId, workflowVersion);

  return (
    <div className={cn('relative flex h-80 w-full flex-col gap-4 py-2', className)}>
      <ScrollArea className="px-2">
        <div className="flex flex-col gap-4">
          {triggers?.map((it, i) => (
            <Trigger trigger={it} workflowId={workflowId} workflowVersion={workflowVersion} key={i} />
          ))}
        </div>
      </ScrollArea>
      <Button
        className={cn(!isLatestWorkflowVersion && 'hidden')}
        variant="outline"
        icon={<Plus />}
        onClick={() => VinesEvent.emit('flow-trigger-selector', workflowId)}
      >
        添加触发器
      </Button>
      <TriggerSelector />
    </div>
  );
};
