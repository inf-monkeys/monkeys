import React from 'react';

import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { ToolPropertyTypes } from '@inf-monkeys/monkeys/src/types/tool.ts';
import { get, isArray, isBoolean } from 'lodash';
import { Copy } from 'lucide-react';
import { useTranslation } from 'react-i18next';

import {
  VINES_WORKFLOW_INPUT_SPECIAL_TYPES,
  VINES_WORKFLOW_INPUT_TYPE_DISPLAY_MAPPER,
} from '@/components/layout/workspace/vines-view/flow/headless-modal/endpoint/start-tool/workflow-input-config/input-config/consts.ts';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card.tsx';
import { Separator } from '@/components/ui/separator.tsx';
import { Tag } from '@/components/ui/tag';
import { TagGroup } from '@/components/ui/tag/tag-group.tsx';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { useCopy } from '@/hooks/use-copy.ts';
import { VinesWorkflowVariable } from '@/package/vines-flow/core/tools/typings';
import { cn, getI18nContent } from '@/utils';
import { stringify } from '@/utils/fast-stable-stringify.ts';

interface IInputItemProps {
  children?: (variableId: string, specialType?: ToolPropertyTypes) => React.ReactNode;
  cardClassName?: string;
  contentWidth?: number;
  defaultValueText?: string;
  disabledTypeTag?: boolean;
  index: number;
  inputLastIndex: number;
  inputLength: number;
  it: VinesWorkflowVariable;
}

export const InputItem: React.FC<IInputItemProps> = ({
  children,
  cardClassName,
  contentWidth,
  defaultValueText,
  disabledTypeTag,
  index,
  inputLastIndex,
  inputLength,
  it,
}) => {
  const { name: variableId, displayName, type, default: defaultData, typeOptions } = it;
  const { t } = useTranslation();
  const { copy } = useCopy({ timeout: 500 });
  const defaultValueType = typeof defaultData;
  const assetType = get(typeOptions, 'assetType', null);
  const multipleValues = get(typeOptions, 'multipleValues', false);

  const isSpecialType = VINES_WORKFLOW_INPUT_SPECIAL_TYPES.includes(type);

  const child = children?.(variableId, isSpecialType ? type : void 0);

  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: it.name });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  // 生成要复制的变量引用字符串
  const variableReference = `\${workflow.input.${variableId}}`;

  return (
    <Card
      className={cn(
        'mb-0.5 flex cursor-grab flex-col gap-2 p-global',
        inputLength > 1 && index !== inputLastIndex && 'mb-2',
        isDragging && 'opacity-50',
        cardClassName,
      )}
      key={it.name}
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
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

          {/* 添加复制按钮 */}
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                className="scale-75 px-2"
                variant="outline"
                size="small"
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  copy(variableReference);
                }}
              >
                <Copy className="size-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <div className="text-center">
                <div>点击复制变量引用</div>
                <div className="mt-1 text-xs text-gray-500">{variableReference}</div>
              </div>
            </TooltipContent>
          </Tooltip>
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
};
