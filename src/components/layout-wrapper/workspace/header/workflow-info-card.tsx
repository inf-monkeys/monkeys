import React from 'react';

import { Pencil } from 'lucide-react';

import { useVinesPage } from '@/components/layout-wrapper/workspace/utils.ts';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { VinesIcon } from '@/components/ui/vines-icon';

interface IWorkflowInfoCardProps extends React.ComponentPropsWithoutRef<'div'> {}

export const WorkflowInfoCard: React.FC<IWorkflowInfoCardProps> = () => {
  const { workflow } = useVinesPage();

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <div className="group flex cursor-pointer items-center gap-2.5">
          <VinesIcon size="sm">{workflow?.iconUrl}</VinesIcon>
          <h1 className="font-bold">{workflow?.name}</h1>

          <div className="mt-0.5 opacity-0 transition-opacity group-hover:opacity-70">
            <Pencil size={12} />
          </div>
        </div>
      </TooltipTrigger>
      <TooltipContent>
        <span className="text-sm font-bold">描述：</span>
        <br />
        {workflow?.description || '暂无描述'}
      </TooltipContent>
    </Tooltip>
  );
};
