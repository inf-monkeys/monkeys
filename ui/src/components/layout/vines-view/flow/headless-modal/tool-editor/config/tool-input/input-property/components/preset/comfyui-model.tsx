import React, { useEffect, useState } from 'react';

import { BlockDefPropertyTypes } from '@inf-monkeys/vines';
import { get } from 'lodash';

import { useComfyuiModels } from '@/apis/comfyui';
import { IVinesInputPropertyProps } from '@/components/layout/vines-view/flow/headless-modal/tool-editor/config/tool-input/input-property';
import { IVinesInputPresetProps } from '@/components/layout/vines-view/flow/headless-modal/tool-editor/config/tool-input/input-property/components/preset/index.tsx';
import { PresetWrapper } from '@/components/layout/vines-view/flow/headless-modal/tool-editor/config/tool-input/input-property/components/preset/wrapper.tsx';
import { IVinesToolPropertiesOption, VinesToolDefProperties } from '@/package/vines-flow/core/tools/typings.ts';

export const ComfyuiModelPresets: React.FC<IVinesInputPropertyProps & IVinesInputPresetProps> = (props) => {
  const { data: comfyuiModels, isLoading } = useComfyuiModels();

  const [options, setOptions] = useState<IVinesToolPropertiesOption[]>([]);
  const [optionsVariableMapper, setOptionsVariableMapper] = useState<Record<string, VinesToolDefProperties>>({});

  useEffect(() => {
    if (!comfyuiModels) return;

    const assetType = get(props, 'def.typeOptions.assetType', '');

    const comfyuiModel = comfyuiModels[assetType.replace('comfyui-model-', '')];
    if (!comfyuiModel?.length) return;

    const opts = comfyuiModel.map((model) => ({ name: model, value: model }));
    setOptions(opts);

    const newOptionsVariableMapper: Record<string, VinesToolDefProperties> = {};
    opts.map(
      ({ name, value: optValue }) =>
        (newOptionsVariableMapper[optValue] = {
          displayName: name,
          name: optValue,
          type: '模型' as BlockDefPropertyTypes,
        }),
    );
    setOptionsVariableMapper(newOptionsVariableMapper);
  }, [comfyuiModels]);

  return (
    <PresetWrapper
      id="ComfyuiModel"
      name="ComfyUI 模型"
      isLoading={isLoading}
      options={options}
      optionsVariableMapper={optionsVariableMapper}
      {...props}
    />
  );
};
