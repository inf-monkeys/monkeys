import React, { useRef } from 'react';

import { get } from 'lodash';
import { Link2Icon } from 'lucide-react';

import { IVinesInputPropertyProps } from '@/components/layout/vines-flow/headless-modal/tool-editor/config/tool-input/input-property';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { VariableEditor, VariableEditorRefProps } from '@/components/ui/vines-variable-editor';
import { VinesToolDefProperties } from '@/package/vines-flow/core/tools/typings.ts';
import { useFlowStore } from '@/store/useFlowStore';
import { cn } from '@/utils';
import VinesEvent from '@/utils/events.ts';

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
}) => {
  const { workflowId } = useFlowStore();

  const variableEditorRef = useRef<VariableEditorRefProps>({ insertVariable: () => {} });

  return (
    <div className={cn('relative', { 'pointer-events-none': disabled })}>
      <VariableEditor
        editorRef={variableEditorRef}
        initialValue={value?.toString() ?? ''}
        onChange={onChange}
        placeholder={def?.placeholder ?? `请输入${def?.displayName}`}
        initialPointMapper={{ ...variableMapper, ...extraVariableMapper }}
      />
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
          <TooltipContent>插入变量</TooltipContent>
        </Tooltip>
      )}
    </div>
  );
};
