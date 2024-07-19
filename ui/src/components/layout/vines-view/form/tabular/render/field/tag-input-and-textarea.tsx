import React, { useMemo } from 'react';

import { t } from 'i18next';
import { isArray, isUndefined } from 'lodash';
import { ControllerRenderProps, FieldValues, UseFormReturn } from 'react-hook-form';

import { TagInput } from '@/components/ui/input/tag';
import { Textarea } from '@/components/ui/textarea.tsx';
import { VinesWorkflowVariable } from '@/package/vines-flow/core/tools/typings.ts';
import { IWorkflowInputForm } from '@/schema/workspace/workflow-input-form.ts';

interface IFieldTagInputAndTextareaProps {
  input: VinesWorkflowVariable;
  value: any;
  onChange: (value: any) => void;
  form: UseFormReturn<IWorkflowInputForm>;
  field: Omit<ControllerRenderProps<FieldValues, string>, 'value' | 'onChange'>;
}

export const FieldTagInputAndTextarea: React.FC<IFieldTagInputAndTextareaProps> = ({
  input: { name, type, typeOptions, displayName },
  value,
  onChange,
  form,
  field,
}) => {
  const isNumber = type === 'number';
  const isMultiple = typeOptions?.multipleValues ?? false;

  const visible = useMemo(
    () =>
      type === 'string' ||
      (type === 'number' &&
        (isUndefined(typeOptions?.minValue) ||
          isUndefined(typeOptions?.maxValue) ||
          typeOptions?.numberPrecision === 0)),
    [type, typeOptions],
  );

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
      <Textarea
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
        className="grow"
        {...field}
      />
    ))
  );
};
