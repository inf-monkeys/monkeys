import React, { useMemo } from 'react';

import { ControllerRenderProps, FieldValues, UseFormReturn } from 'react-hook-form';
import { useTranslation } from 'react-i18next';

import { TextWithButtons } from '@/components/layout/workspace/vines-view/form/tabular/render/field/text-with-buttons';
import { VinesWorkflowVariable } from '@/package/vines-flow/core/tools/typings.ts';
import { IWorkflowInputForm } from '@/schema/workspace/workflow-input-form.ts';
import { getI18nContent } from '@/utils';

interface IFieldTextInputWithButtonsProps {
  input: VinesWorkflowVariable;
  value: any;
  onChange: (value: any) => void;
  form: UseFormReturn<IWorkflowInputForm>;
  field: Omit<ControllerRenderProps<FieldValues, string>, 'value' | 'onChange'>;
  miniMode?: boolean;
}

export const FieldTextInputWithButtons: React.FC<IFieldTextInputWithButtonsProps> = ({
  input: { type, typeOptions, displayName: inputDisplayName },
  value,
  onChange,
  form,
  field,
  miniMode = false,
}) => {
  const { t } = useTranslation();

  const visible = useMemo(() => type === 'string' || (miniMode && type === 'file'), [type, typeOptions, miniMode]);

  const displayName = getI18nContent(inputDisplayName);

  const placeholder =
    typeOptions?.placeholder ?? t('workspace.pre-view.actuator.execution-form.string', { displayName });

  return (
    visible && (
      <TextWithButtons
        placeholder={placeholder}
        value={(value as string) ?? ''}
        onChange={(value) => {
          onChange(value);
        }}
        minHeight={typeOptions?.textareaMiniHeight ?? 120}
        maxHeight={300}
      />
    )
  );
};
