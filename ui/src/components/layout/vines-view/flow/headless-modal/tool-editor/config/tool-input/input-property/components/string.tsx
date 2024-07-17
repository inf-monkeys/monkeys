import React, { useRef, useState } from 'react';

import { get, isString } from 'lodash';
import { Link2Icon } from 'lucide-react';
import { useTranslation } from 'react-i18next';

import { IVinesInputPropertyProps } from '@/components/layout/vines-view/flow/headless-modal/tool-editor/config/tool-input/input-property';
import { Button } from '@/components/ui/button';
import { HoverCard, HoverCardContent, HoverCardTrigger } from '@/components/ui/hover-card.tsx';
import { ScrollArea } from '@/components/ui/scroll-area.tsx';
import { Separator } from '@/components/ui/separator.tsx';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { VariableEditor, VariableEditorRefProps } from '@/components/ui/vines-variable-editor';
import { VinesToolDefProperties } from '@/package/vines-flow/core/tools/typings.ts';
import { useFlowStore } from '@/store/useFlowStore';
import { cn, getI18nContent } from '@/utils';
import VinesEvent from '@/utils/events.ts';
import { stringify } from '@/utils/fast-stable-stringify.ts';

interface IStringInputProps {
  extraVariableMapper?: Record<string, VinesToolDefProperties>;
}

export const StringInput: React.FC<IVinesInputPropertyProps & IStringInputProps> = ({
  def,
  value,
  onChange,
  disabled,
  variableMapper,
  extraVariableMapper = {},
  refresh = false,
}) => {
  const { t } = useTranslation();

  const { workflowId } = useFlowStore();

  const variableEditorRef = useRef<VariableEditorRefProps>({ insertVariable: () => {} });

  const stringValue = isString(value) ? value : stringify(value);

  const [previewVisible, setPreviewVisible] = useState<boolean>(false);
  const [continuousDisplay, setContinuousDisplay] = useState<boolean>(true);
  const [previewValue, setPreviewValue] = useState<string>(stringValue);

  return (
    <HoverCard
      openDelay={200}
      open={previewVisible}
      onOpenChange={(status) => continuousDisplay && setPreviewVisible(status)}
    >
      <HoverCardTrigger asChild>
        <div className={cn('relative', { 'pointer-events-none': disabled })}>
          {!refresh && (
            <VariableEditor
              editorRef={variableEditorRef}
              initialValue={stringValue}
              onChange={(val) => {
                onChange(val);
                setPreviewValue(val);
              }}
              onBlur={() => {
                setContinuousDisplay(true);
                setPreviewVisible(false);
              }}
              onFocus={() => {
                setContinuousDisplay(false);
                setPreviewVisible(true);
              }}
              placeholder={
                getI18nContent(def?.placeholder) ??
                t('workspace.flow-view.headless-modal.tool-editor.input.comps.string.placeholder', {
                  name: getI18nContent(def?.displayName),
                })
              }
              initialPointMapper={{ ...variableMapper, ...extraVariableMapper }}
            />
          )}

          {!disabled && (
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  className="absolute right-1 top-1 !scale-75 cursor-pointer opacity-50 hover:opacity-100"
                  variant="borderless"
                  icon={<Link2Icon />}
                  onClick={(e: React.MouseEvent<HTMLButtonElement, MouseEvent>) =>
                    VinesEvent.emit(
                      'flow-variable-selector',
                      workflowId,
                      e,
                      variableEditorRef.current.insertVariable,
                      get(def, 'typeOptions.assemblyValueType', 'simple'),
                    )
                  }
                />
              </TooltipTrigger>
              <TooltipContent>
                {t('workspace.flow-view.headless-modal.tool-editor.input.comps.string.insert-variable')}
              </TooltipContent>
            </Tooltip>
          )}
        </div>
      </HoverCardTrigger>
      <HoverCardContent
        side="left"
        sideOffset={8}
        className={cn('flex flex-col gap-1 p-2 transition-opacity', !previewValue && 'opacity-0')}
      >
        <h1 className="text-base font-bold">
          {t('workspace.flow-view.headless-modal.tool-editor.input.comps.string.preview', {
            title: getI18nContent(def?.displayName ?? ''),
          })}
        </h1>
        <Separator />
        <ScrollArea className="h-24">
          <p className="max-w-60 break-words text-xs opacity-85">{previewValue}</p>
        </ScrollArea>
      </HoverCardContent>
    </HoverCard>
  );
};
