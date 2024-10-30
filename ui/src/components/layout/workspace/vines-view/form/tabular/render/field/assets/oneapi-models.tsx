import React from 'react';

import { useCreation } from 'ahooks';
import { isArray } from 'lodash';
import { useTranslation } from 'react-i18next';

import { useOneAPIModels } from '@/apis/llm';
import { TagInput } from '@/components/ui/input/tag';
import { VinesWorkflowVariable } from '@/package/vines-flow/core/tools/typings.ts';
import { getI18nContent } from '@/utils';

interface IFieldOneApiModelsProps {
  input: VinesWorkflowVariable;
  value: any;
  onChange: (name: string, value: string[]) => void;

  extra?: Record<string, any>;
}

export const FieldOneApiModels: React.FC<IFieldOneApiModelsProps> = ({
  input: { displayName, name },
  value,
  onChange,
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
      onChange={(value) => onChange(name, value)}
      placeholder={t('workspace.flow-view.headless-modal.tool-editor.input.comps.collection.placeholder', {
        name: getI18nContent(displayName),
      })}
      options={options}
    />
  );
};
