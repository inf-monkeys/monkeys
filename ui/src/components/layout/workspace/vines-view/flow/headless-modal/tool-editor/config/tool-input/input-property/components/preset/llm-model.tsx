import React, { useEffect, useState } from 'react';

import { ToolPropertyTypes } from '@inf-monkeys/monkeys';
import { useTranslation } from 'react-i18next';

import { useLLMModels } from '@/apis/llm';
import { IVinesInputPropertyProps } from '@/components/layout/workspace/vines-view/flow/headless-modal/tool-editor/config/tool-input/input-property';
import { IVinesInputPresetProps } from '@/components/layout/workspace/vines-view/flow/headless-modal/tool-editor/config/tool-input/input-property/components/preset/index.tsx';
import { PresetWrapper } from '@/components/layout/workspace/vines-view/flow/headless-modal/tool-editor/config/tool-input/input-property/components/preset/wrapper.tsx';
import { SelectGroup, SelectItem } from '@/components/ui/select.tsx';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { IVinesToolPropertiesOption, VinesToolDefProperties } from '@/package/vines-flow/core/tools/typings.ts';
import { getI18nContent } from '@/utils';

export interface ILLMModel {
  displayName: string;
  description?: string;
  iconUrl: string;
  channelId: number;
  model: string;
  value: string;
}

export const LlmModelPresets: React.FC<IVinesInputPropertyProps & IVinesInputPresetProps> = (props) => {
  const { t } = useTranslation();

  const { data: llmModels, isLoading } = useLLMModels();

  const [options, setOptions] = useState<IVinesToolPropertiesOption[]>([]);
  const [cardOptions, setCardOptions] = useState<ILLMModel[]>([]);
  const [optionsVariableMapper, setOptionsVariableMapper] = useState<Record<string, VinesToolDefProperties>>({});

  useEffect(() => {
    if (!llmModels) return;
    const realLLMModels: Array<{ displayName: string; channelId: number; model: string }> = [];
    const cardLLMModels: ILLMModel[] = [];
    for (const item of llmModels) {
      const models = item.models;
      const modelNames = Object.values(models);
      for (const model of modelNames) {
        const i18nDisplayName = getI18nContent(item.displayName);
        realLLMModels.push({
          displayName: `${i18nDisplayName} - ${model}${item.channelId === 0 ? ` (${t('common.utils.system')})` : ''}`,
          channelId: item.channelId,
          model: model,
        });
        cardLLMModels.push({
          displayName: `${item.channelId === 0 ? '' : `${model} - `}${i18nDisplayName ?? model}`,
          description: getI18nContent(item.description),
          iconUrl: item?.iconUrl ?? '',
          channelId: item.channelId,
          model: model,
          value: item.channelId === 0 ? model : `${item.channelId}:${model}`,
        });
      }
    }
    setCardOptions(cardLLMModels);

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
    >
      <SelectGroup>
        {cardOptions.map(({ displayName, value, iconUrl, channelId, model, description }, i) => (
          <Tooltip key={i}>
            <TooltipTrigger asChild>
              <SelectItem value={value}>
                <div className="flex items-center gap-2">
                  {iconUrl && <img src={iconUrl} alt={displayName} className="size-6" />}
                  <p className="text-sm font-bold">{displayName}</p>
                  {channelId === 0 && (
                    <p className="text-xxs model-tag rounded border border-input bg-muted p-1">
                      {t('common.utils.system')}
                    </p>
                  )}
                </div>
              </SelectItem>
            </TooltipTrigger>
            <TooltipContent className="max-w-72" side={i === 0 ? 'bottom' : 'top'}>
              <span className="text-sm font-bold">{model}</span>
              <br />
              {description}
            </TooltipContent>
          </Tooltip>
        ))}
      </SelectGroup>
    </PresetWrapper>
  );
};
