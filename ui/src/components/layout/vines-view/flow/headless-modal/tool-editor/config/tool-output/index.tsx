import React from 'react';

import { useClipboard } from '@mantine/hooks';
import { Copy } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';

import { buttonVariants } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { Tree, TreeDataItem } from '@/components/ui/tree.tsx';
import { useVinesFlow } from '@/package/vines-flow';
import { VINES_VARIABLE_TAG } from '@/package/vines-flow/core/tools/consts.ts';
import { IVinesVariable } from '@/package/vines-flow/core/tools/typings.ts';
import { cn, execCopy } from '@/utils';

interface IToolOutputProps {
  nodeId?: string;
}

export const ToolOutput: React.FC<IToolOutputProps> = ({ nodeId }) => {
  const { t } = useTranslation();
  const clipboard = useClipboard({ timeout: 500 });
  const { vines } = useVinesFlow();

  const { variables } = vines.generateWorkflowVariables();

  const data = variables.filter(({ targetId }) => targetId === nodeId) as unknown as TreeDataItem[];

  return (
    <Tree
      className="size-full flex-shrink-0"
      data={data}
      expandAll
      initialSelectedItemId={data?.[0]?.id}
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
                  if (!clipboard.copied && !execCopy(it.id)) toast.error(t('common.toast.copy-failed'));
                  else toast.success(t('common.toast.copy-success'));
                }}
              >
                <span
                  className="text-xxs line-clamp-1 cursor-default select-none whitespace-nowrap break-all rounded-sm px-1 py-1 font-medium leading-none shadow-inner"
                  style={{
                    backgroundColor: (isMultiple ? tag?.multipleColor : tag?.color) ?? 'hsl(var(--muted-foreground))',
                  }}
                >
                  {tag?.name ?? it.type}
                  {isMultiple ? '列表' : ''}
                </span>
                <span className="line-clamp-1 break-normal">{it.label}</span>
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
            <span
              className="text-xxs line-clamp-1 cursor-default select-none whitespace-nowrap break-all rounded-sm px-1 py-1 font-medium leading-none shadow-inner"
              style={{
                backgroundColor: (isMultiple ? tag?.multipleColor : tag?.color) ?? 'hsl(var(--muted-foreground))',
              }}
            >
              {tag?.name ?? it.type}
              {isMultiple ? '列表' : ''}
            </span>
            <span className="line-clamp-1 break-normal">{it.label}</span>
            <div className="relative flex-1">
              <Tooltip>
                <TooltipTrigger asChild>
                  <div
                    className={cn(
                      buttonVariants({ variant: 'outline' }),
                      'absolute right-0 top-1/2 -translate-y-1/2 scale-75 px-2',
                    )}
                    onClick={(e) => {
                      e.preventDefault();
                      clipboard.copy(it.jsonpath);
                      if (!clipboard.copied && !execCopy(it.jsonpath)) toast.error(t('common.toast.copy-failed'));
                      else toast.success(t('common.toast.copy-success'));
                    }}
                  >
                    <Copy className="size-4" />
                  </div>
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
