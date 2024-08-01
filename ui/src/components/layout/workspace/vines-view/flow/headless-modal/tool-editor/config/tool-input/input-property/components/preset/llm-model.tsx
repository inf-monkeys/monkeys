import React, { useEffect, useState } from 'react';

import { ToolPropertyTypes } from '@inf-monkeys/monkeys';
import { useTranslation } from 'react-i18next';

import { useLLMModels } from '@/apis/llm';
import { IVinesInputPropertyProps } from '@/components/layout/workspace/vines-view/flow/headless-modal/tool-editor/config/tool-input/input-property';
import { IVinesInputPresetProps } from '@/components/layout/workspace/vines-view/flow/headless-modal/tool-editor/config/tool-input/input-property/components/preset/index.tsx';
import { PresetWrapper } from '@/components/layout/workspace/vines-view/flow/headless-modal/tool-editor/config/tool-input/input-property/components/preset/wrapper.tsx';
import { IVinesToolPropertiesOption, VinesToolDefProperties } from '@/package/vines-flow/core/tools/typings.ts';
import { getI18nContent } from '@/utils';

export const LlmModelPresets: React.FC<IVinesInputPropertyProps & IVinesInputPresetProps> = (props) => {
  const { t } = useTranslation();

  const { data: llmModels, isLoading } = useLLMModels();

  const [options, setOptions] = useState<IVinesToolPropertiesOption[]>([]);
  const [optionsVariableMapper, setOptionsVariableMapper] = useState<Record<string, VinesToolDefProperties>>({});

  useEffect(() => {
    if (!llmModels) return;
    const realLLMModels: Array<{ displayName: string; channelId: number; model: string }> = [];
    for (const item of llmModels) {
      const models = item.models;
      const modelNames = Object.values(models);
      for (const model of modelNames) {
        realLLMModels.push({
          displayName: `${getI18nContent(item.displayName)} - ${model}`,
          channelId: item.channelId,
          model: model,
        });
      }
    }
    const opts = realLLMModels.map((m) => ({
      name: m.displayName,
      value: m.channelId === 0 ? m.model : `${m.channelId}:${m.model}`,
    }));

    setOptions(opts);

    const newOptionsVariableMapper: Record<string, VinesToolDefProperties> = {};
    opts.map(
      ({ name, value: optValue }) =>
        (newOptionsVariableMapper[optValue] = {
          displayName: name,
          name: optValue,
          type: t('workspace.flow-view.headless-modal.tool-editor.input.comps.preset.llm-model') as ToolPropertyTypes,
        }),
    );
    setOptionsVariableMapper(newOptionsVariableMapper);
  }, [llmModels]);

  return (
    <PresetWrapper
      id="LlmModel"
      name={t('workspace.flow-view.headless-modal.tool-editor.input.comps.preset.llm-model')}
      isLoading={isLoading}
      options={options}
      optionsVariableMapper={optionsVariableMapper}
      {...props}
    />
  );
};
