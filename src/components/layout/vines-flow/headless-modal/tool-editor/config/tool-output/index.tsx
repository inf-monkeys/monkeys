import React from 'react';

import { useClipboard } from '@mantine/hooks';
import { Copy } from 'lucide-react';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { Tree, TreeDataItem } from '@/components/ui/tree.tsx';
import { useVinesFlow } from '@/package/vines-flow';
import { VINES_VARIABLE_TAG } from '@/package/vines-flow/core/tools/consts.ts';
import { IVinesVariable } from '@/package/vines-flow/core/tools/typings.ts';

interface IToolOutputProps {
  nodeId?: string;
}

export const ToolOutput: React.FC<IToolOutputProps> = ({ nodeId }) => {
  const clipboard = useClipboard({ timeout: 500 });
  const { vines } = useVinesFlow();

  const { variables } = vines.generateWorkflowVariables();

  const data = variables.filter(({ targetId }) => targetId === nodeId) as unknown as TreeDataItem[];

  return (
    <Tree
      className="size-full flex-shrink-0"
      data={data}
      expandAll
      initialSelectedItemId={data?.[0].id}
      leafRenderer={(it: IVinesVariable) => {
        const tag = VINES_VARIABLE_TAG[it.type];
        const isMultiple = it.isMultiple;
        return (
          <Tooltip>
            <TooltipTrigger asChild>
              <div
                className="flex size-full items-center gap-2 p-2 text-sm"
                onClick={() => {
                  clipboard.copy(it.id);
                  toast.success('变量已复制');
                }}
              >
                <div
                  className="text-xxs cursor-default select-none whitespace-nowrap rounded-sm px-1 py-1 font-medium leading-none shadow-inner"
                  style={{
                    backgroundColor: (isMultiple ? tag?.multipleColor : tag?.color) ?? '#2b2e35',
                  }}
                >
                  {tag?.name ?? it.type}
                  {isMultiple ? '列表' : ''}
                </div>
                {it.label}
              </div>
            </TooltipTrigger>
            <TooltipContent>{it.id}</TooltipContent>
          </Tooltip>
        );
      }}
      labelRenderer={(it: IVinesVariable, onExpand) => {
        const tag = VINES_VARIABLE_TAG[it.type];
        const isMultiple = it.isMultiple;
        return (
          <div className="flex size-full items-center gap-2 p-2 text-sm" onClick={onExpand}>
            <div
              className="text-xxs cursor-default select-none whitespace-nowrap rounded-sm px-1 py-1 font-medium leading-none shadow-inner"
              style={{
                backgroundColor: (isMultiple ? tag?.multipleColor : tag?.color) ?? '#2b2e35',
              }}
            >
              {tag?.name ?? it.type}
              {isMultiple ? '列表' : ''}
            </div>
            {it.label}
            <div className="flex-1">
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    icon={<Copy />}
                    variant="outline"
                    className="absolute -mt-4 ml-2 scale-75"
                    onClick={(e) => {
                      e.preventDefault();
                      clipboard.copy(it.jsonpath);
                      toast.success('变量已复制');
                    }}
                  />
                </TooltipTrigger>
                <TooltipContent>{it.jsonpath}</TooltipContent>
              </Tooltip>
            </div>
          </div>
        );
      }}
    />
  );
};
