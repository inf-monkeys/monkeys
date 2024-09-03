import React from 'react';

import { useCreation } from 'ahooks';
import { isArray } from 'lodash';
import { ControllerRenderProps, FieldValues, UseFormReturn } from 'react-hook-form';
import { useTranslation } from 'react-i18next';

import { useOneAPIModels } from '@/apis/llm';
import { TagInput } from '@/components/ui/input/tag';
import { VinesWorkflowVariable } from '@/package/vines-flow/core/tools/typings.ts';
import { IWorkflowInputForm } from '@/schema/workspace/workflow-input-form.ts';
import { getI18nContent } from '@/utils';

interface IFieldOneApiModelsProps {
  input: VinesWorkflowVariable;
  value: any;
  onChange: (value: any) => void;
  form: UseFormReturn<IWorkflowInputForm>;
  field: Omit<ControllerRenderProps<FieldValues, string>, 'value' | 'onChange'>;

  extra?: Record<string, any>;
}

export const FieldOneApiModels: React.FC<IFieldOneApiModelsProps> = ({
  input: { displayName, name },
  value,
  onChange,
  field,
  form,
  extra = {},
}) => {
  const { t } = useTranslation();

  const { data } = useOneAPIModels();

  const modelId = extra?.modelId;
  const options = useCreation(() => {
    if (modelId) {
      return data?.find((it) => it.value === modelId)?.models?.map((m) => ({ value: m, label: m })) ?? [];
    }

    return (Array.from(new Set(data?.flatMap((it) => it.models))) ?? []).map((m) => ({ value: m, label: m }));
  }, [data, modelId]);

  return (
    <TagInput
      value={isArray(value) ? value.map((it: string | number | boolean) => it.toString()) : []}
      onChange={(value) => form.setValue(name, value)}
      placeholder={t('workspace.flow-view.headless-modal.tool-editor.input.comps.collection.placeholder', {
        name: getI18nContent(displayName),
      })}
      options={options}
    />
  );
};
