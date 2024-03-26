import React, { useEffect, useState } from 'react';

import { AnimatePresence, motion } from 'framer-motion';

import { ExecutionStatusIcon } from '@/components/layout/vines-execution/status-icon';
import { Card } from '@/components/ui/card.tsx';
import { ScrollArea } from '@/components/ui/scroll-area.tsx';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { VinesIcon } from '@/components/ui/vines-icon';
import { useVinesFlow } from '@/package/vines-flow';
import { VinesNode } from '@/package/vines-flow/core/nodes';
import { VinesNodeExecutionTask } from '@/package/vines-flow/core/nodes/typings.ts';
import { cn } from '@/utils';

export interface IActuatorToolList {
  id: string;
  status: VinesNodeExecutionTask['status'];
  icon: string;
  name: string;
  customName?: string;
  description: string;
  node: VinesNode;
}

interface IActuatorToolListProps {
  height: number;
  activeTool?: VinesNode;
  setActiveTool?: React.Dispatch<React.SetStateAction<VinesNode | undefined>>;
}

export const ActuatorToolList: React.FC<IActuatorToolListProps> = ({ height, activeTool, setActiveTool }) => {
  const { vines, VINES_REFRESHER } = useVinesFlow();

  const [tools, setTools] = useState<IActuatorToolList[]>([]);

  const workflowStatus = vines.executionStatus;

  useEffect(() => {
    const nodes = vines.getAllNodes();

    const newTools: IActuatorToolList[] = [];
    for (const node of nodes.slice(1, nodes.length - 1)) {
      if (node.executionStatus === 'DEFAULT' && workflowStatus !== 'SCHEDULED') continue;
      const { name: toolName } = node.getRaw();
      const tool = vines.getTool(toolName);
      const customData = node.customData;

      const toolDesc = tool?.description ?? '';
      const customDesc = customData?.description ?? '';

      newTools.push({
        node,
        id: node.id,
        status: node.executionStatus,
        icon: customData?.icon ?? tool?.icon ?? '',
        name: tool?.displayName ?? toolName,
        customName: customData?.title ?? '',
        description: customDesc ? `${customDesc} / ${toolDesc}` : `${toolDesc}`,
      });
    }
    if (activeTool?.executionTask?.status === 'DEFAULT' || !activeTool) {
      setActiveTool?.(nodes[1]);
    }
    setTools(newTools);
  }, [VINES_REFRESHER]);

  return (
    <ScrollArea className="pr-3" style={{ height }}>
      <div className="flex flex-col gap-2">
        <AnimatePresence>
          {tools.map(({ id, status, icon, name, customName, description, node }) => (
            <motion.div
              key={id}
              initial={{ opacity: 0, bottom: -30, marginTop: -12 }}
              animate={{ opacity: 1, bottom: 0, marginTop: 0 }}
              exit={{ opacity: 0, bottom: -30, marginTop: -12 }}
            >
              <Card
                className={cn(
                  'relative m-1 flex cursor-pointer items-center p-2 hover:bg-gray-10/5 active:bg-gray-10/10',
                  activeTool?.id === id && 'outline outline-vines-500',
                )}
                onClick={() => setActiveTool?.(node)}
              >
                <div className="flex items-center gap-2">
                  <div className="flex size-12 items-center justify-center overflow-clip rounded-lg border shadow-sm">
                    <VinesIcon src={icon} size="lg" />
                  </div>
                  <div className="flex max-w-[13rem] flex-col gap-1 leading-5">
                    <div className="flex items-center gap-2">
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <div className="flex items-end gap-2">
                            <p className="line-clamp-1 text-sm font-bold leading-tight">{customName || name}</p>
                            {customName && (
                              <span className="line-clamp-1 min-w-[3rem] text-xs font-light text-gray-10">{name}</span>
                            )}
                          </div>
                        </TooltipTrigger>
                        <TooltipContent className="max-w-64">
                          {`${customName}${customName ? ' / ' : ''}${name}`}
                        </TooltipContent>
                      </Tooltip>
                    </div>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <div className="line-clamp-1 !text-xs font-normal opacity-50">{description}</div>
                      </TooltipTrigger>
                      <TooltipContent className="max-w-64" side="bottom">
                        {description}
                      </TooltipContent>
                    </Tooltip>
                  </div>
                </div>
                <div className="mx-2 flex flex-1 justify-end">
                  <ExecutionStatusIcon status={status} workflowStatus={workflowStatus} />
                </div>
              </Card>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </ScrollArea>
  );
};
