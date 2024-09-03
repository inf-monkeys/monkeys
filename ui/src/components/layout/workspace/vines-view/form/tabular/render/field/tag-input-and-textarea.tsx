import React, { useMemo } from 'react';

import { t } from 'i18next';
import { isArray } from 'lodash';
import { ControllerRenderProps, FieldValues, UseFormReturn } from 'react-hook-form';

import { AutosizeTextarea } from '@/components/ui/autosize-textarea.tsx';
import { TagInput } from '@/components/ui/input/tag';
import { VinesWorkflowVariable } from '@/package/vines-flow/core/tools/typings.ts';
import { IWorkflowInputForm } from '@/schema/workspace/workflow-input-form.ts';
import { getI18nContent } from '@/utils';

interface IFieldTagInputAndTextareaProps {
  input: VinesWorkflowVariable;
  value: any;
  onChange: (value: any) => void;
  form: UseFormReturn<IWorkflowInputForm>;
  field: Omit<ControllerRenderProps<FieldValues, string>, 'value' | 'onChange'>;

  miniMode?: boolean;
}

export const FieldTagInputAndTextarea: React.FC<IFieldTagInputAndTextareaProps> = ({
  input: { name, type, typeOptions, displayName: inputDisplayName },
  value,
  onChange,
  form,
  field,
  miniMode = false,
}) => {
  const isNumber = type === 'number';
  const isMultiple = typeOptions?.multipleValues ?? false;

  const visible = useMemo(() => type === 'string' || (miniMode && type === 'file'), [type, typeOptions, miniMode]);

  const displayName = getI18nContent(inputDisplayName);

  return (
    visible &&
    (isMultiple ? (
      <TagInput
        value={isArray(value) ? value.map((it: string | number | boolean) => it.toString()) : []}
        onChange={(value) =>
          form.setValue(
            name,
            value.filter((it) => (isNumber ? !isNaN(Number(it)) : it)),
          )
        }
        placeholder={t('workspace.pre-view.actuator.execution-form.string', { displayName })}
      />
    ) : (
      <AutosizeTextarea
        placeholder={t('workspace.pre-view.actuator.execution-form.string', { displayName })}
        value={(value as string) ?? ''}
        onChange={(value) => {
          if (isNumber) {
            const numberValue = Number(value);
            onChange(isNaN(numberValue) ? '' : numberValue);
          } else {
            onChange(value);
          }
        }}
        minHeight={40}
        maxHeight={200}
        {...field}
      />
    ))
  );
};
