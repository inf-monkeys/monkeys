import React, { useEffect, useRef, useState } from 'react';

import { AnimatePresence, motion } from 'framer-motion';

import { ExecutionStatusIcon } from '@/components/layout/workspace/vines-view/_common/status-icon';
import { Card } from '@/components/ui/card.tsx';
import { ScrollArea } from '@/components/ui/scroll-area.tsx';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { VinesIcon } from '@/components/ui/vines-icon';
import { useVinesFlow } from '@/package/vines-flow';
import { VinesNode } from '@/package/vines-flow/core/nodes';
import { VinesNodeExecutionTask } from '@/package/vines-flow/core/nodes/typings.ts';
import { cn, getI18nContent } from '@/utils';

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
  instanceId?: string;
}

export const ActuatorToolList: React.FC<IActuatorToolListProps> = ({
  height,
  activeTool,
  setActiveTool,
  instanceId,
}) => {
  const { vines, VINES_REFRESHER } = useVinesFlow();

  const [tools, setTools] = useState<IActuatorToolList[]>([]);

  const workflowStatus = vines.executionStatus();

  useEffect(() => {
    const nodes = vines.getAllNodes();

    const newTools: IActuatorToolList[] = [];
    for (const node of nodes.slice(1, nodes.length - 1)) {
      const nodeStatus = node.getExecutionTask(instanceId)?.status ?? 'DEFAULT';

      if (nodeStatus === 'DEFAULT' && workflowStatus !== 'SCHEDULED') continue;
      const { name: toolName } = node.getRaw();
      const tool = vines.getTool(toolName);
      const customData = node.customData;

      const toolDesc = getI18nContent(tool?.description) ?? '';
      const customDesc = customData?.description ?? '';

      newTools.push({
        node,
        id: node.id,
        status: nodeStatus,
        icon: customData?.icon ?? tool?.icon ?? '',
        name: getI18nContent(tool?.displayName) ?? toolName,
        customName: customData?.title ?? '',
        description: customDesc ? `${customDesc} / ${toolDesc}` : `${toolDesc}`,
      });
    }

    if (setActiveTool) {
      const activeNode = nodes
        .filter((node) => ['IN_PROGRESS', 'SCHEDULED'].includes(node.getExecutionTask(instanceId)?.status ?? ''))
        .sort(
          (a, b) => (a.getExecutionTask(instanceId)?.startTime ?? 0) - (b.getExecutionTask(instanceId)?.startTime ?? 0),
        )
        .sort((a) => (['SUB_WORKFLOW', 'DO_WHILE'].includes(a.type) ? 1 : -1));
      if (activeNode?.[0]) {
        setActiveTool(activeNode[0]);
      } else if (nodes?.[1]) {
        setActiveTool(nodes[1]);
      }
    }

    setTools(newTools);
  }, [VINES_REFRESHER]);

  const container = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (container.current) {
      container.current.childNodes.forEach((node) => {
        if (node instanceof HTMLElement) {
          if (node.dataset.nodeId === activeTool?.id) {
            setTimeout(() => node.scrollIntoView({ behavior: 'smooth', block: 'center', inline: 'center' }), 300);
          }
        }
      });
    }
  }, [activeTool]);

  return (
    <ScrollArea className="pr-3" style={{ height }} disabledOverflowMask>
      <div ref={container} className="flex flex-col gap-2">
        <AnimatePresence>
          {tools.map(({ id, status, icon, name, customName, description, node }, i) => (
            <motion.div
              className="min-w-64"
              key={id + i}
              initial={{ opacity: 0, bottom: -30, marginTop: -12 }}
              animate={{ opacity: 1, bottom: 0, marginTop: 0 }}
              exit={{ opacity: 0, bottom: -30, marginTop: -12 }}
              data-node-id={id}
            >
              <Card
                className={cn(
                  'relative m-1 flex cursor-pointer items-center justify-between p-2 hover:bg-gray-10/5 active:bg-gray-10/10',
                  activeTool?.id === id && 'outline outline-vines-500',
                )}
                onClick={() => setActiveTool?.(node)}
              >
                <div className="flex flex-1 items-center gap-2">
                  <div className="flex size-12 items-center justify-center overflow-hidden rounded-lg border shadow-sm">
                    <VinesIcon src={icon} size="md" />
                  </div>
                  <div className="flex max-w-[13rem] flex-1 flex-col gap-1 leading-5">
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
                        <div className="line-clamp-1 max-w-[calc(100%-2rem)] !text-xs font-normal opacity-50">
                          {description}
                        </div>
                      </TooltipTrigger>
                      <TooltipContent className="max-w-64" side="bottom">
                        {description}
                      </TooltipContent>
                    </Tooltip>
                  </div>
                </div>
                <div className="mx-2">
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
