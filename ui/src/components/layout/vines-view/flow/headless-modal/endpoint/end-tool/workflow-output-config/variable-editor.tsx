import React, { useRef } from 'react';

import { Link2Icon } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { VariableEditor, VariableEditorRefProps } from '@/components/ui/vines-variable-editor';
import { IVinesVariableMap } from '@/package/vines-flow/core/tools/typings.ts';
import VinesEvent from '@/utils/events.ts';

interface IVariableEditorProps extends Omit<React.ComponentPropsWithoutRef<'div'>, 'onChange'> {
  value: string;
  onChange: (val: string) => void;
  variableMapper: Record<string, IVinesVariableMap>;
  workflowId: string;
  disabled?: boolean;
}

export const WorkflowOutputVariableEditor: React.FC<IVariableEditorProps> = ({
  value,
  onChange,
  variableMapper,
  workflowId,
  disabled,
}) => {
  const variableEditorRef = useRef<VariableEditorRefProps>({ insertVariable: () => {} });

  return (
    <>
      <VariableEditor
        className="min-h-10 w-full max-w-64"
        initialPointMapper={variableMapper}
        editorRef={variableEditorRef}
        initialValue={value}
        onChange={onChange}
      />
      {!disabled && (
        <Button
          className="absolute right-1 top-1 opacity-70"
          icon={<Link2Icon />}
          variant="borderless"
          onClick={(e: React.MouseEvent<HTMLButtonElement>) =>
            VinesEvent.emit('flow-variable-selector', workflowId, e, variableEditorRef.current.insertVariable)
          }
        />
      )}
    </>
  );
};
