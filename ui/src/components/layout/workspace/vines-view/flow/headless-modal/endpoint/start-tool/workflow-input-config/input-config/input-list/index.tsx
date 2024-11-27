import React from 'react';

import { ToolPropertyTypes } from '@inf-monkeys/monkeys/src/types/tool.ts';
import { get, isArray, isBoolean } from 'lodash';
import { useTranslation } from 'react-i18next';

import {
  VINES_WORKFLOW_INPUT_SPECIAL_TYPES,
  VINES_WORKFLOW_INPUT_TYPE_DISPLAY_MAPPER,
} from '@/components/layout/workspace/vines-view/flow/headless-modal/endpoint/start-tool/workflow-input-config/input-config/consts.ts';
import { Card } from '@/components/ui/card.tsx';
import { ScrollArea } from '@/components/ui/scroll-area.tsx';
import { Separator } from '@/components/ui/separator.tsx';
import { Tag } from '@/components/ui/tag';
import { TagGroup } from '@/components/ui/tag/tag-group.tsx';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { VinesWorkflowVariable } from '@/package/vines-flow/core/tools/typings.ts';
import { cn, getI18nContent } from '@/utils';
import { stringify } from '@/utils/fast-stable-stringify.ts';

interface IWorkflowInputListProps {
  inputs: VinesWorkflowVariable[];
  children?: (variableId: string, specialType?: ToolPropertyTypes) => React.ReactNode;
  className?: string;
  cardClassName?: string;
  contentWidth?: number;
  defaultValueText?: string;
  disabledTypeTag?: boolean;
}

export const WorkflowInputList: React.FC<IWorkflowInputListProps> = ({
  inputs,
  defaultValueText = 'Default Value',
  children,
  className,
  cardClassName,
  contentWidth,
  disabledTypeTag = false,
}) => {
  const { t } = useTranslation();

  const inputLength = inputs.length;
  const inputLastIndex = inputLength - 1;

  return (
    <ScrollArea className={className} disabledOverflowMask>
      {inputs.map((it, index) => {
        const { name: variableId, displayName, type, default: defaultData, typeOptions } = it;
        const defaultValueType = typeof defaultData;
        const assetType = get(typeOptions, 'assetType', null);
        const multipleValues = get(typeOptions, 'multipleValues', false);

        const isSpecialType = VINES_WORKFLOW_INPUT_SPECIAL_TYPES.includes(type);

        const child = children?.(variableId, isSpecialType ? type : void 0);
        return (
          <Card
            className={cn(
              'mb-0.5 flex flex-col gap-2 p-4',
              inputLength > 1 && index !== inputLastIndex && 'mb-2',
              cardClassName,
            )}
            key={index}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                {disabledTypeTag ? null : (
                  <Tag className={cn('text-xxs bg-muted py-1 shadow-sm', isSpecialType && 'bg-muted-foreground/35')}>
                    {isSpecialType
                      ? type
                      : VINES_WORKFLOW_INPUT_TYPE_DISPLAY_MAPPER[
                          type + (assetType ? `:${assetType}` : '') + (multipleValues ? '-list' : '')
                        ]}
                  </Tag>
                )}

                <h1 className="font-bold">{getI18nContent(displayName)}</h1>
              </div>
              {child}
            </div>
            <Separator />
            <div className="break-word flex flex-col gap-2 px-2 text-xs" style={{ width: contentWidth }}>
              {defaultValueType === 'undefined' ? (
                <p>{t('workspace.flow-view.endpoint.start-tool.input.def-empty')}</p>
              ) : (
                <>
                  {defaultValueText && <span className="-mt-1 text-xs text-gray-10">{defaultValueText}</span>}
                  {defaultValueType === 'boolean' ? (
                    defaultData ? (
                      t('workspace.flow-view.endpoint.start-tool.input.def-true')
                    ) : (
                      t('workspace.flow-view.endpoint.start-tool.input.def-false')
                    )
                  ) : isArray(defaultData) ? (
                    <TagGroup
                      className="bg-slate-1/80 shadow-sm"
                      maxTagCount={10}
                      tagList={(defaultData as string[]).map((v) => {
                        const value = isBoolean(v)
                          ? v
                            ? t('workspace.flow-view.endpoint.start-tool.input.def-true')
                            : t('workspace.flow-view.endpoint.start-tool.input.def-false')
                          : v;
                        return {
                          children: (
                            <Tooltip>
                              <TooltipTrigger>{v.length > 25 ? v.slice(0, 25) + '...' : value}</TooltipTrigger>
                              <TooltipContent>{value}</TooltipContent>
                            </Tooltip>
                          ),
                        };
                      })}
                      size="large"
                    />
                  ) : (
                    <p className="break-words">{stringify(defaultData).replace(/^"|"$/g, '')}</p>
                  )}
                </>
              )}
            </div>
          </Card>
        );
      })}
    </ScrollArea>
  );
};
