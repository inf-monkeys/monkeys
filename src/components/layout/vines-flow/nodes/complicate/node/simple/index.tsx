import React from 'react';

import { CircleEllipsisIcon, Save } from 'lucide-react';

import { ComplicateNodeHeader } from '@/components/layout/vines-flow/nodes/complicate/node/header.tsx';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { IVinesNodeCustomData } from '@/package/vines-flow/core/nodes/typings.ts';
import { VinesToolDef } from '@/package/vines-flow/core/tools/typings.ts';
import VinesEvent from '@/utils/events.ts';

interface IComplicateSimpleNodeProps {
  workflowId: string;
  nodeId: string;
  tool?: VinesToolDef;
  toolName: string;
  customData: IVinesNodeCustomData;
}

export const ComplicateSimpleNode: React.FC<IComplicateSimpleNodeProps> = ({
  workflowId,
  nodeId,
  tool,
  toolName,
  customData,
}) => {
  return (
    <>
      <ComplicateNodeHeader tool={tool} toolName={toolName} customData={customData}>
        <div className="flex gap-2">
          <Tooltip>
            <TooltipTrigger asChild>
              <Button icon={<Save />} size="small" variant="outline" />
            </TooltipTrigger>
            <TooltipContent>保存配置</TooltipContent>
          </Tooltip>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                icon={<CircleEllipsisIcon />}
                size="small"
                variant="outline"
                onClick={(e) => VinesEvent.emit('canvas-context-menu', workflowId, e, 'NODE', nodeId)}
              />
            </TooltipTrigger>
            <TooltipContent>更多</TooltipContent>
          </Tooltip>
        </div>
      </ComplicateNodeHeader>
    </>
  );
};
