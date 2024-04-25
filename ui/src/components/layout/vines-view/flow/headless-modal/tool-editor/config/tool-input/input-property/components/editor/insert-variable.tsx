import React from 'react';

import { Link2Icon } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { VariableEditorRefProps } from '@/components/ui/vines-variable-editor';
import { useFlowStore } from '@/store/useFlowStore';
import VinesEvent from '@/utils/events.ts';

interface IInsertVariableProps {
  insertVariablesFn: VariableEditorRefProps['insertVariable'];
}

export const InsertVariable: React.FC<IInsertVariableProps> = ({ insertVariablesFn }) => {
  const { workflowId } = useFlowStore();

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Button
          className="!scale-75 cursor-pointer opacity-50 hover:opacity-100"
          variant="borderless"
          icon={<Link2Icon />}
          onClick={(e: React.MouseEvent<HTMLButtonElement, MouseEvent>) => {
            VinesEvent.emit('flow-variable-selector', workflowId, e, insertVariablesFn, 'simple');
          }}
        />
      </TooltipTrigger>
      <TooltipContent>在光标处插入变量</TooltipContent>
    </Tooltip>
  );
};
