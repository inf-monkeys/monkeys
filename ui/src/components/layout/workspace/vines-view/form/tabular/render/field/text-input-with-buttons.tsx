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
  input: { name, type, typeOptions, displayName: inputDisplayName },
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

  // 智能优化处理函数
  const handleSmartOptimize = () => {
    // 这里可以添加智能优化的逻辑
    console.log('Smart optimize for:', name);
  };

  // 提示词词典处理函数
  const handleShowDictionary = () => {
    // 这里可以添加显示提示词词典的逻辑
    console.log('Show dictionary for:', name);
  };

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
        onSmartOptimize={handleSmartOptimize}
        onShowDictionary={handleShowDictionary}
      />
    )
  );
};
