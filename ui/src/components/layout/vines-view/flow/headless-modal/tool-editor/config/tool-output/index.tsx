import React from 'react';

import { Copy } from 'lucide-react';
import { useTranslation } from 'react-i18next';

import { buttonVariants } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { Tree, TreeDataItem } from '@/components/ui/tree.tsx';
import { useCopy } from '@/hooks/use-copy.ts';
import { useVinesFlow } from '@/package/vines-flow';
import { VINES_VARIABLE_TAG } from '@/package/vines-flow/core/tools/consts.ts';
import { IVinesVariable } from '@/package/vines-flow/core/tools/typings.ts';
import { cn, getI18nContent } from '@/utils';

interface IToolOutputProps {
  nodeId?: string;
}

export const ToolOutput: React.FC<IToolOutputProps> = ({ nodeId }) => {
  const { t } = useTranslation();
  const { copy } = useCopy({ timeout: 500 });
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
        const type = it.type;
        const tag = VINES_VARIABLE_TAG[type];
        const isMultiple = it.isMultiple;

        const tagName = tag?.name;

        return (
          <Tooltip>
            <TooltipTrigger asChild>
              <div className="flex size-full items-center gap-2 p-2 text-sm" onClick={() => copy(it.id)}>
                <span
                  className="text-xxs line-clamp-1 cursor-default select-none whitespace-nowrap break-all rounded-sm px-1 py-1 font-medium leading-none shadow-inner"
                  style={{
                    backgroundColor: (isMultiple ? tag?.multipleColor : tag?.color) ?? 'hsl(var(--muted-foreground))',
                  }}
                >
                  {tagName
                    ? t(`workspace.flow-view.headless-modal.tool-editor.input.type.${tagName}`, {
                        extra: isMultiple
                          ? t('workspace.flow-view.headless-modal.tool-editor.input.type.multiple')
                          : '',
                      })
                    : type + (isMultiple ? ' list' : '')}
                </span>
                <span className="line-clamp-1 break-normal">{getI18nContent(it.label)}</span>
              </div>
            </TooltipTrigger>
            <TooltipContent>{it.id}</TooltipContent>
          </Tooltip>
        );
      }}
      labelRenderer={(it: IVinesVariable, onExpand) => {
        const type = it.type;
        const tag = VINES_VARIABLE_TAG[type];
        const isMultiple = it.isMultiple;

        const tagName = tag?.name;

        return (
          <div className="flex size-full items-center gap-2 p-2 text-sm" onClick={onExpand}>
            <span
              className="text-xxs line-clamp-1 cursor-default select-none whitespace-nowrap break-all rounded-sm px-1 py-1 font-medium leading-none shadow-inner"
              style={{
                backgroundColor: (isMultiple ? tag?.multipleColor : tag?.color) ?? 'hsl(var(--muted-foreground))',
              }}
            >
              {tagName
                ? t(`workspace.flow-view.headless-modal.tool-editor.input.type.${tagName}`, {
                    extra: isMultiple ? t('workspace.flow-view.headless-modal.tool-editor.input.type.multiple') : '',
                  })
                : type + (isMultiple ? ' list' : '')}
            </span>
            <span className="line-clamp-1 break-normal">{getI18nContent(it.label)}</span>
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
                      copy(it.jsonpath);
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
